package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
)

// Dumb AI forward pipe — no API keys on the relay. The client sends
// Authorization: Bearer <user-key> and we pass the request through to OpenAI
// so browser PWAs can avoid CORS blocks. The relay never stores or logs keys.

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

	auth := r.Header.Get("Authorization")
	if auth == "" || !strings.HasPrefix(auth, "Bearer ") || len(strings.TrimSpace(strings.TrimPrefix(auth, "Bearer "))) < 10 {
		writeAIJSON(w, http.StatusUnauthorized, map[string]string{
			"error": "Authorization: Bearer <your-openai-key> required — configure your key in vault Settings",
		})
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	upstream, err := http.NewRequest(http.MethodPost, "https://api.openai.com/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		writeAIJSON(w, http.StatusInternalServerError, map[string]string{"error": "forward setup failed"})
		return
	}
	upstream.Header.Set("Content-Type", "application/json")
	upstream.Header.Set("Authorization", auth)

	resp, err := http.DefaultClient.Do(upstream)
	if err != nil {
		log.Printf("ai forward: upstream error: %v", err)
		writeAIJSON(w, http.StatusBadGateway, map[string]string{"error": "upstream unreachable"})
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<20))
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)

	if resp.StatusCode != http.StatusOK {
		w.Write(respBody)
		return
	}

	var parsed struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(respBody, &parsed); err != nil || len(parsed.Choices) == 0 {
		writeAIJSON(w, http.StatusBadGateway, map[string]string{"error": "invalid upstream response"})
		return
	}
	if parsed.Error != nil {
		writeAIJSON(w, http.StatusBadGateway, map[string]string{"error": parsed.Error.Message})
		return
	}

	writeAIJSON(w, http.StatusOK, map[string]any{
		"answer":     parsed.Choices[0].Message.Content,
		"citedNotes": []string{},
	})
}

func setAICORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func writeAIJSON(w http.ResponseWriter, status int, payload any) {
	setAICORS(w)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("ai: encode response: %v", err)
	}
}
