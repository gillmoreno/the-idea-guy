package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/the-idea-guy/backend/internal/content"
)

type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Time    string `json:"time"`
}

type Server struct {
	store *content.Store
}

func main() {
	dataDir := content.ResolveDataDir()
	store, err := content.NewStore(dataDir)
	if err != nil {
		log.Fatal(err)
	}

	addr := envOrDefault("API_ADDR", ":8080")
	server := &Server{store: store}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", server.handleHealth)
	mux.HandleFunc("GET /api/snippets", server.handleSnippets)
	mux.HandleFunc("GET /api/builds", server.handleBuilds)
	mux.HandleFunc("GET /api/ideas", server.handleIdeas)
	mux.HandleFunc("GET /api/tools", server.handleTools)

	log.Printf("the-idea-guy API listening on %s (content: %s)", addr, dataDir)
	if err := http.ListenAndServe(addr, withCORS(mux)); err != nil {
		log.Fatal(err)
	}
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, HealthResponse{
		Status:  "ok",
		Service: "the-idea-guy",
		Time:    time.Now().UTC().Format(time.RFC3339),
	})
}

func (s *Server) handleSnippets(w http.ResponseWriter, r *http.Request) {
	items, err := s.store.Snippets()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Server) handleBuilds(w http.ResponseWriter, r *http.Request) {
	items, err := s.store.Builds()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Server) handleIdeas(w http.ResponseWriter, r *http.Request) {
	items, err := s.store.Ideas()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (s *Server) handleTools(w http.ResponseWriter, r *http.Request) {
	items, err := s.store.Tools()
	if err != nil {
		writeError(w, http.StatusInternalServerError, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("encode response: %v", err)
	}
}

func writeError(w http.ResponseWriter, status int, err error) {
	log.Printf("request error: %v", err)
	writeJSON(w, status, map[string]string{
		"error": err.Error(),
	})
}

func envOrDefault(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
