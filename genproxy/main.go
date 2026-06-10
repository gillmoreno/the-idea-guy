// Command genproxy is the stateless room-schema generation proxy
// (docs_and_changelog/ROOM_AI.md).
//
// It holds the platform AI key and the system prompt; clients send only a
// short room description and get back a RoomSchema JSON. It has no database
// and stores no user content — its only state is an operational monthly-spend
// counter. Schema-constrained output plus a low token cap make it useless as
// a free general-purpose LLM; per-IP rate limits and a hard monthly budget
// bound the worst-case bill. When the budget is gone it degrades to 429
// "budget_exhausted" and the app falls back to the copy-paste prompt flow.
//
// The prompt embedded from prompt.txt is an API-adapted copy of the canonical
// apps/rooms/web/src/schema/prompt.ts — keep them in sync.
package main

import (
	"bytes"
	"context"
	_ "embed"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/anthropics/anthropic-sdk-go"
)

//go:embed prompt.txt
var systemPrompt string

const upstreamTimeout = 60 * time.Second

type config struct {
	addr             string
	provider         string // "anthropic" (Claude SDK) or "openai" (any OpenAI-compatible endpoint)
	upstreamURL      string // openai provider only
	anthropicBaseURL string // anthropic provider; empty = api.anthropic.com (override for tests)
	apiKey           string
	model            string
	maxTokens        int
	maxDescChars     int
	gensPerIPHour    int
	monthlyBudgetUSD float64
	priceInUSD       float64 // per 1M input tokens
	priceOutUSD      float64 // per 1M output tokens
	dataDir          string
	allowOrigin      string
}

func loadConfig() config {
	provider := envOr("GENPROXY_PROVIDER", "anthropic")
	cfg := config{
		addr:             envOr("GENPROXY_ADDR", ":4600"),
		provider:         provider,
		upstreamURL:      envOr("GENPROXY_UPSTREAM_URL", "https://opencode.ai/zen/v1/chat/completions"),
		apiKey:           os.Getenv("GENPROXY_API_KEY"),
		maxTokens:        envInt("GENPROXY_MAX_TOKENS", 1600),
		maxDescChars:     envInt("GENPROXY_MAX_DESC_CHARS", 500),
		gensPerIPHour:    envInt("GENPROXY_GENS_PER_IP_HOUR", 20),
		monthlyBudgetUSD: envFloat("GENPROXY_MONTHLY_BUDGET_USD", 10),
		dataDir:          os.Getenv("GENPROXY_DATA_DIR"),
		allowOrigin:      envOr("GENPROXY_ALLOW_ORIGIN", "*"),
	}
	// Per-provider defaults: model and $/1M prices for the spend meter.
	if provider == "anthropic" {
		cfg.model = envOr("GENPROXY_MODEL", "claude-haiku-4-5")
		cfg.priceInUSD = envFloat("GENPROXY_PRICE_IN_USD", 1.00)
		cfg.priceOutUSD = envFloat("GENPROXY_PRICE_OUT_USD", 5.00)
		if cfg.apiKey == "" {
			cfg.apiKey = os.Getenv("ANTHROPIC_API_KEY")
		}
	} else {
		cfg.model = envOr("GENPROXY_MODEL", "deepseek-v4-flash")
		cfg.priceInUSD = envFloat("GENPROXY_PRICE_IN_USD", 0.14)
		cfg.priceOutUSD = envFloat("GENPROXY_PRICE_OUT_USD", 0.28)
	}
	return cfg
}

func main() {
	loadDotEnv(".env")
	cfg := loadConfig()
	if cfg.apiKey == "" {
		log.Fatal("genproxy: GENPROXY_API_KEY is required (set it in the environment or genproxy/.env — see .env.example)")
	}
	srv := newServer(cfg)

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	mux.HandleFunc("/generate", srv.handleGenerate)

	httpSrv := &http.Server{
		Addr:              cfg.addr,
		Handler:           mux,
		ReadHeaderTimeout: 10 * time.Second,
	}
	log.Printf("genproxy: listening on %s (provider %s, model %s, budget $%.2f/mo, %d gens/ip/hour)",
		cfg.addr, cfg.provider, cfg.model, cfg.monthlyBudgetUSD, cfg.gensPerIPHour)
	if err := httpSrv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("genproxy: %v", err)
	}
}

type server struct {
	cfg       config
	budget    *budget
	limiter   *ipBucket
	client    *http.Client
	anthropic anthropic.Client
}

func newServer(cfg config) *server {
	s := &server{
		cfg:     cfg,
		budget:  newBudget(cfg),
		limiter: newIPBucket(cfg.gensPerIPHour),
		client:  &http.Client{Timeout: upstreamTimeout},
	}
	if cfg.provider == "anthropic" {
		s.anthropic = newAnthropicClient(cfg)
	}
	return s
}

type generateRequest struct {
	Description string `json:"description"`
}

func (s *server) handleGenerate(w http.ResponseWriter, r *http.Request) {
	s.cors(w)
	switch r.Method {
	case http.MethodOptions:
		w.WriteHeader(http.StatusNoContent)
		return
	case http.MethodPost:
	default:
		writeError(w, http.StatusMethodNotAllowed, "bad_request", "POST only")
		return
	}

	var req generateRequest
	if err := json.NewDecoder(io.LimitReader(r.Body, 16<<10)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "bad_request", "invalid JSON body")
		return
	}
	desc := strings.TrimSpace(req.Description)
	if desc == "" {
		writeError(w, http.StatusBadRequest, "bad_request", "description is required")
		return
	}
	if utf8.RuneCountInString(desc) > s.cfg.maxDescChars {
		writeError(w, http.StatusBadRequest, "bad_request", "description too long")
		return
	}

	if !s.limiter.allow(clientIP(r)) {
		writeError(w, http.StatusTooManyRequests, "rate_limited", "too many generations from this address, try later")
		return
	}
	if s.budget.exhausted() {
		writeError(w, http.StatusTooManyRequests, "budget_exhausted", "free generation is resting this month — use the copy-paste prompt instead")
		return
	}

	schema, err := s.generate(r.Context(), desc)
	if err != nil {
		log.Printf("genproxy: generation failed: %v", err)
		writeError(w, http.StatusBadGateway, "generation_failed", "the model returned something unusable, try again")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"schema": schema})
}

// generate runs one generation through the configured provider, meters the
// spend, and returns the parsed schema.
func (s *server) generate(ctx context.Context, description string) (map[string]any, error) {
	var content string
	var inTokens, outTokens int64
	var err error
	if s.cfg.provider == "anthropic" {
		content, inTokens, outTokens, err = s.callAnthropic(ctx, description)
	} else {
		content, inTokens, outTokens, err = s.callOpenAI(ctx, description)
	}
	s.budget.add(inTokens, outTokens)
	if err != nil {
		return nil, err
	}
	return parseSchemaJSON(content)
}

// callOpenAI runs one generation through an OpenAI-compatible chat-completions
// endpoint (e.g. OpenCode Zen) and returns the text plus token usage.
func (s *server) callOpenAI(ctx context.Context, description string) (string, int64, int64, error) {
	body := map[string]any{
		"model": s.cfg.model,
		"messages": []map[string]string{
			{"role": "system", "content": systemPrompt},
			{"role": "user", "content": description},
		},
		"max_tokens":      s.cfg.maxTokens,
		"temperature":     0.4,
		"response_format": map[string]string{"type": "json_object"},
	}
	resp, err := s.callUpstream(ctx, body)
	if err != nil {
		// Some OpenAI-compatible servers reject response_format; retry without.
		delete(body, "response_format")
		resp, err = s.callUpstream(ctx, body)
		if err != nil {
			return "", 0, 0, err
		}
	}
	if len(resp.Choices) == 0 {
		return "", resp.Usage.PromptTokens, resp.Usage.CompletionTokens, errors.New("upstream returned no choices")
	}
	return resp.Choices[0].Message.Content, resp.Usage.PromptTokens, resp.Usage.CompletionTokens, nil
}

type chatResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int64 `json:"prompt_tokens"`
		CompletionTokens int64 `json:"completion_tokens"`
	} `json:"usage"`
}

func (s *server) callUpstream(ctx context.Context, body map[string]any) (*chatResponse, error) {
	payload, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, s.cfg.upstreamURL, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.cfg.apiKey)
	req.Header.Set("Content-Type", "application/json")

	httpResp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(httpResp.Body, 4<<20))
	if err != nil {
		return nil, err
	}
	if httpResp.StatusCode != http.StatusOK {
		return nil, errors.New("upstream status " + httpResp.Status + ": " + truncate(string(raw), 200))
	}
	var resp chatResponse
	if err := json.Unmarshal(raw, &resp); err != nil {
		return nil, err
	}
	return &resp, nil
}

// parseSchemaJSON extracts the schema object from model output, tolerating
// markdown fences and stray prose, and sanity-checks the shape. Full
// validation stays client-side (apps/rooms/web/src/schema/validate.ts).
func parseSchemaJSON(content string) (map[string]any, error) {
	text := strings.TrimSpace(content)
	if start := strings.IndexByte(text, '{'); start >= 0 {
		if end := strings.LastIndexByte(text, '}'); end > start {
			text = text[start : end+1]
		}
	}
	var schema map[string]any
	if err := json.Unmarshal([]byte(text), &schema); err != nil {
		return nil, errors.New("output is not valid JSON: " + truncate(content, 120))
	}
	if _, ok := schema["schemaVersion"].(float64); !ok {
		return nil, errors.New("output missing schemaVersion")
	}
	if name, ok := schema["name"].(string); !ok || strings.TrimSpace(name) == "" {
		return nil, errors.New("output missing name")
	}
	collections, ok := schema["collections"].([]any)
	if !ok || len(collections) == 0 {
		return nil, errors.New("output missing collections")
	}
	return schema, nil
}

func (s *server) cors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", s.cfg.allowOrigin)
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": code, "message": message})
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}

// --- env helpers ---

// loadDotEnv reads KEY=VALUE lines from path (gitignored genproxy/.env) into
// the environment. Real environment variables win over file values.
func loadDotEnv(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return // no .env is fine; plain env vars still work
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if key == "" || os.Getenv(key) != "" {
			continue
		}
		_ = os.Setenv(key, value)
	}
	log.Printf("genproxy: loaded %s", path)
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		log.Printf("genproxy: bad %s=%q, using %d", key, v, fallback)
		return fallback
	}
	return n
}

func envFloat(key string, fallback float64) float64 {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	f, err := strconv.ParseFloat(v, 64)
	if err != nil {
		log.Printf("genproxy: bad %s=%q, using %g", key, v, fallback)
		return fallback
	}
	return f
}
