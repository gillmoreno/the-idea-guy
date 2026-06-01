package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

type aiNote struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	PlainText string `json:"plainText"`
}

type aiChatRequest struct {
	Question      string   `json:"question"`
	RelevantNotes []aiNote `json:"relevantNotes"`
	Mode          string   `json:"mode"`
}

type aiChatResponse struct {
	Answer     string   `json:"answer"`
	CitedNotes []string `json:"citedNotes"`
}

type openAIRequest struct {
	Model    string          `json:"model"`
	Messages []openAIMessage `json:"messages"`
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIResponse struct {
	Choices []struct {
		Message openAIMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error"`
}

func handleAIChat(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		writeAIJSON(w, http.StatusServiceUnavailable, map[string]string{
			"error": "OPENAI_API_KEY not configured on relay",
		})
		return
	}

	body, err := io.ReadAll(io.LimitReader(r.Body, 1<<20))
	if err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}

	var req aiChatRequest
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.Question) == "" {
		http.Error(w, "question required", http.StatusBadRequest)
		return
	}

	contextBlock := buildContext(req.RelevantNotes)
	systemPrompt := "You are a helpful assistant answering questions about the user's personal notes. " +
		"Only use the provided note excerpts. Cite note titles when relevant. " +
		"If the excerpts don't contain enough information, say so."
	if req.Mode == "summarize" {
		systemPrompt = "Summarize the provided note concisely in 2-4 sentences. Focus on key points."
	}

	userContent := req.Question
	if contextBlock != "" {
		userContent = "Note excerpts:\n\n" + contextBlock + "\n\nQuestion: " + req.Question
	}

	model := envOr("OPENAI_MODEL", "gpt-4o-mini")
	oaiReq := openAIRequest{
		Model: model,
		Messages: []openAIMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userContent},
		},
	}
	payload, _ := json.Marshal(oaiReq)

	oaiResp, err := http.Post(
		"https://api.openai.com/v1/chat/completions",
		"application/json",
		bytes.NewReader(payload),
	)
	if err != nil {
		log.Printf("ai: openai request failed: %v", err)
		writeAIJSON(w, http.StatusBadGateway, map[string]string{"error": "upstream error"})
		return
	}
	defer oaiResp.Body.Close()

	respBody, _ := io.ReadAll(oaiResp.Body)
	var parsed openAIResponse
	if err := json.Unmarshal(respBody, &parsed); err != nil {
		writeAIJSON(w, http.StatusBadGateway, map[string]string{"error": "invalid upstream response"})
		return
	}
	if parsed.Error != nil {
		writeAIJSON(w, http.StatusBadGateway, map[string]string{"error": parsed.Error.Message})
		return
	}
	if len(parsed.Choices) == 0 {
		writeAIJSON(w, http.StatusBadGateway, map[string]string{"error": "empty response"})
		return
	}

	cited := make([]string, 0, len(req.RelevantNotes))
	for _, n := range req.RelevantNotes {
		if n.Title != "" {
			cited = append(cited, n.Title)
		} else {
			cited = append(cited, n.ID)
		}
	}

	writeAIJSON(w, http.StatusOK, aiChatResponse{
		Answer:     parsed.Choices[0].Message.Content,
		CitedNotes: cited,
	})
}

func buildContext(notes []aiNote) string {
	var b strings.Builder
	for i, n := range notes {
		if i > 0 {
			b.WriteString("\n\n---\n\n")
		}
		b.WriteString("Note: ")
		b.WriteString(n.Title)
		b.WriteString("\n")
		text := n.PlainText
		if len(text) > 2000 {
			text = text[:2000] + "…"
		}
		b.WriteString(text)
	}
	return b.String()
}

func writeAIJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("ai: encode response: %v", err)
	}
}
