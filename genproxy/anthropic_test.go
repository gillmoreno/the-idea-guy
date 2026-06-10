package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// fakeAnthropic returns a Messages-API-shaped response wrapping content.
func fakeAnthropic(t *testing.T, content string) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/messages" {
			t.Errorf("path = %s, want /v1/messages", r.URL.Path)
		}
		if got := r.Header.Get("X-Api-Key"); got != "test-key" {
			t.Errorf("x-api-key = %q", got)
		}
		var body map[string]any
		_ = json.NewDecoder(r.Body).Decode(&body)
		if body["model"] != "claude-haiku-4-5" {
			t.Errorf("model = %v", body["model"])
		}
		if _, ok := body["system"]; !ok {
			t.Error("request missing system prompt")
		}
		resp := map[string]any{
			"id": "msg_test", "type": "message", "role": "assistant",
			"model":       "claude-haiku-4-5",
			"content":     []map[string]string{{"type": "text", "text": content}},
			"stop_reason": "end_turn",
			"usage":       map[string]int64{"input_tokens": 1500, "output_tokens": 400},
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	}))
}

func TestGenerateViaAnthropic(t *testing.T) {
	up := fakeAnthropic(t, goodSchemaJSON)
	defer up.Close()
	s := testServer("", func(c *config) {
		c.provider = "anthropic"
		c.anthropicBaseURL = up.URL
		c.model = "claude-haiku-4-5"
		c.priceInUSD = 1.00
		c.priceOutUSD = 5.00
	})

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
	// Haiku pricing metered: 1500 in at $1/1M + 400 out at $5/1M
	want := 1500.0/1e6*1.00 + 400.0/1e6*5.00
	s.budget.mu.Lock()
	defer s.budget.mu.Unlock()
	if diff := s.budget.spentUSD - want; diff > 1e-12 || diff < -1e-12 {
		t.Fatalf("spentUSD = %g, want %g", s.budget.spentUSD, want)
	}
}
