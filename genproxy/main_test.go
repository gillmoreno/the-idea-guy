package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

const goodSchemaJSON = `{
  "schemaVersion": 1, "engineVersion": 1, "id": "cook-votes",
  "name": "Cook Votes", "emoji": "🍲", "accent": "#22c55e",
  "collections": [{"id": "meals", "label": "Meals", "fields": [{"key": "title", "label": "Title", "type": "text", "required": true}]}],
  "features": [{"type": "votes", "collection": "meals", "onePerMember": true}]
}`

// fakeUpstream returns an OpenAI-style chat completion wrapping content.
func fakeUpstream(t *testing.T, content string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if got := r.Header.Get("Authorization"); got != "Bearer test-key" {
			t.Errorf("upstream auth = %q", got)
		}
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		msgs, _ := body["messages"].([]any)
		if len(msgs) != 2 {
			t.Errorf("upstream got %d messages, want system+user", len(msgs))
		}
		resp := map[string]any{
			"choices": []map[string]any{{"message": map[string]string{"content": content}}},
			"usage":   map[string]int64{"prompt_tokens": 1500, "completion_tokens": 400},
		}
		_ = json.NewEncoder(w).Encode(resp)
	}))
}

func testServer(upstreamURL string, mutate func(*config)) *server {
	cfg := config{
		upstreamURL:      upstreamURL,
		apiKey:           "test-key",
		model:            "test-model",
		maxTokens:        1600,
		maxDescChars:     500,
		gensPerIPHour:    0,
		monthlyBudgetUSD: 10,
		priceInUSD:       0.14,
		priceOutUSD:      0.28,
		allowOrigin:      "*",
	}
	if mutate != nil {
		mutate(&cfg)
	}
	return newServer(cfg)
}

func postGenerate(s *server, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, "/generate", strings.NewReader(body))
	req.RemoteAddr = "9.9.9.9:1234"
	w := httptest.NewRecorder()
	s.handleGenerate(w, req)
	return w
}

func TestGenerateHappyPath(t *testing.T) {
	up := fakeUpstream(t, goodSchemaJSON)
	defer up.Close()
	s := testServer(up.URL, nil)

	w := postGenerate(s, `{"description":"my roommates vote on what to cook"}`)
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, body %s", w.Code, w.Body.String())
	}
	var resp struct {
		Schema map[string]any `json:"schema"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("response not JSON: %v", err)
	}
	if resp.Schema["name"] != "Cook Votes" {
		t.Fatalf("schema.name = %v", resp.Schema["name"])
	}
	// usage was metered: 1500 in + 400 out at 0.14/0.28 per 1M
	want := 1500.0/1e6*0.14 + 400.0/1e6*0.28
	s.budget.mu.Lock()
	defer s.budget.mu.Unlock()
	if diff := s.budget.spentUSD - want; diff > 1e-12 || diff < -1e-12 {
		t.Fatalf("spentUSD = %g, want %g", s.budget.spentUSD, want)
	}
}

func TestGenerateStripsFencesAndProse(t *testing.T) {
	up := fakeUpstream(t, "Here you go!\n```json\n"+goodSchemaJSON+"\n```\nEnjoy.")
	defer up.Close()
	s := testServer(up.URL, nil)
	if w := postGenerate(s, `{"description":"a potluck"}`); w.Code != http.StatusOK {
		t.Fatalf("status = %d, body %s", w.Code, w.Body.String())
	}
}

func TestGenerateRejectsBadOutput(t *testing.T) {
	up := fakeUpstream(t, `{"schemaVersion": 1, "name": "No Collections"}`)
	defer up.Close()
	s := testServer(up.URL, nil)
	w := postGenerate(s, `{"description":"something"}`)
	if w.Code != http.StatusBadGateway {
		t.Fatalf("status = %d, want 502", w.Code)
	}
	if !strings.Contains(w.Body.String(), "generation_failed") {
		t.Fatalf("body = %s", w.Body.String())
	}
}

func TestDescriptionValidation(t *testing.T) {
	s := testServer("http://unused.invalid", nil)
	if w := postGenerate(s, `{"description":"  "}`); w.Code != http.StatusBadRequest {
		t.Fatalf("empty description: status = %d, want 400", w.Code)
	}
	long := `{"description":"` + strings.Repeat("a", 501) + `"}`
	if w := postGenerate(s, long); w.Code != http.StatusBadRequest {
		t.Fatalf("long description: status = %d, want 400", w.Code)
	}
}

func TestBudgetExhausted(t *testing.T) {
	s := testServer("http://unused.invalid", func(c *config) { c.monthlyBudgetUSD = 0.01 })
	s.budget.add(100_000_000, 0) // ≈ $14 — way past the cap
	w := postGenerate(s, `{"description":"a chore app"}`)
	if w.Code != http.StatusTooManyRequests {
		t.Fatalf("status = %d, want 429", w.Code)
	}
	if !strings.Contains(w.Body.String(), "budget_exhausted") {
		t.Fatalf("body = %s", w.Body.String())
	}
}

func TestRateLimited(t *testing.T) {
	up := fakeUpstream(t, goodSchemaJSON)
	defer up.Close()
	s := testServer(up.URL, func(c *config) { c.gensPerIPHour = 1 })
	if w := postGenerate(s, `{"description":"first"}`); w.Code != http.StatusOK {
		t.Fatalf("first: status = %d", w.Code)
	}
	w := postGenerate(s, `{"description":"second"}`)
	if w.Code != http.StatusTooManyRequests || !strings.Contains(w.Body.String(), "rate_limited") {
		t.Fatalf("second: status = %d, body %s", w.Code, w.Body.String())
	}
}

func TestCORSPreflight(t *testing.T) {
	s := testServer("http://unused.invalid", nil)
	req := httptest.NewRequest(http.MethodOptions, "/generate", nil)
	w := httptest.NewRecorder()
	s.handleGenerate(w, req)
	if w.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want 204", w.Code)
	}
	if w.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatalf("missing CORS header")
	}
}

func TestParseSchemaJSON(t *testing.T) {
	for _, bad := range []string{"", "not json", `{"name":"x"}`, `{"schemaVersion":1,"name":"x","collections":[]}`} {
		if _, err := parseSchemaJSON(bad); err == nil {
			t.Fatalf("parseSchemaJSON(%q) should fail", bad)
		}
	}
	if _, err := parseSchemaJSON(goodSchemaJSON); err != nil {
		t.Fatalf("good schema rejected: %v", err)
	}
}
