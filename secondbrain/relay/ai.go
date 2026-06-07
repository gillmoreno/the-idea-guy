package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
)

const defaultOpenAIUpstream = "https://api.openai.com/v1/chat/completions"

// Dumb AI forward pipe — no API keys on the relay. The client sends the
// upstream URL (OpenAI or local Ollama) and Authorization; we pass through.

func handleAIForward(w http.ResponseWriter, r *http.Request) {
	setAICORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	upstreamURL, err := resolveUpstreamURL(r.Header.Get("X-AI-Upstream-URL"))
	if err != nil {
		writeAIJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	isOllama := isLocalOllamaUpstream(upstreamURL)
	auth := r.Header.Get("Authorization")
	if !isOllama {
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") || len(strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))) < 10 {
			writeAIJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "Authorization: Bearer <your-openai-key> required — configure your key in vault Settings",
			})
			return
		}
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	upstream, err := http.NewRequest(http.MethodPost, upstreamURL, bytes.NewReader(body))
	if err != nil {
		writeAIJSON(w, http.StatusInternalServerError, map[string]string{"error": "forward setup failed"})
		return
	}
	upstream.Header.Set("Content-Type", "application/json")
	if auth != "" {
		upstream.Header.Set("Authorization", auth)
	}

	resp, err := http.DefaultClient.Do(upstream)
	if err != nil {
		log.Printf("ai forward: upstream error (%s): %v", upstreamURL, err)
		writeAIJSON(w, http.StatusBadGateway, map[string]string{
			"error": "upstream unreachable — is Ollama running? (ollama serve)",
		})
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)

	// Pass through upstream JSON (supports tool_calls for agentic chat).
	w.Write(respBody)
}

func resolveUpstreamURL(custom string) (string, error) {
	if strings.TrimSpace(custom) == "" {
		return defaultOpenAIUpstream, nil
	}
	u, err := url.Parse(custom)
	if err != nil {
		return "", fmt.Errorf("invalid upstream URL")
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return "", fmt.Errorf("upstream URL must be http or https")
	}
	host := strings.ToLower(u.Hostname())
	if host != "localhost" && host != "127.0.0.1" && host != "::1" {
		return "", fmt.Errorf("custom upstream must be localhost (local Ollama only)")
	}
	return custom, nil
}

func isLocalOllamaUpstream(raw string) bool {
	u, err := url.Parse(raw)
	if err != nil {
		return false
	}
	host := strings.ToLower(u.Hostname())
	return (host == "localhost" || host == "127.0.0.1" || host == "::1") &&
		strings.Contains(u.Path, "/v1/")
}

// handleOllamaTags proxies GET /api/tags so the browser can list local models.
func handleOllamaTags(w http.ResponseWriter, r *http.Request) {
	setAICORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	base, err := resolveOllamaBase(r.URL.Query().Get("base"))
	if err != nil {
		writeAIJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	tagsURL := strings.TrimRight(base, "/") + "/api/tags"
	resp, err := http.Get(tagsURL)
	if err != nil {
		log.Printf("ollama tags: %v", err)
		writeAIJSON(w, http.StatusBadGateway, map[string]string{
			"error": "Ollama not reachable — run ollama serve",
		})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	_, _ = w.Write(body)
}

func resolveOllamaBase(raw string) (string, error) {
	if strings.TrimSpace(raw) == "" {
		raw = "http://127.0.0.1:11434"
	}
	u, err := url.Parse(raw)
	if err != nil {
		return "", fmt.Errorf("invalid Ollama base URL")
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return "", fmt.Errorf("Ollama URL must be http or https")
	}
	host := strings.ToLower(u.Hostname())
	if host != "localhost" && host != "127.0.0.1" && host != "::1" {
		return "", fmt.Errorf("Ollama URL must be localhost")
	}
	return strings.TrimRight(raw, "/"), nil
}

func setAICORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-AI-Upstream-URL")
}

func writeAIJSON(w http.ResponseWriter, status int, payload any) {
	setAICORS(w)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("ai: encode response: %v", err)
	}
}
