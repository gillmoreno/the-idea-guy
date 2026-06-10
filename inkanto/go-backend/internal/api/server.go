package api

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"inkanto/go-backend/internal/auth"
	"inkanto/go-backend/internal/config"
	"inkanto/go-backend/internal/store"
)

type App struct {
	cfg    config.Config
	logger *log.Logger
	store  *store.Store
	tokens *auth.TokenManager
}

func NewApp(cfg config.Config, logger *log.Logger) (*App, error) {
	st, err := store.Open(cfg.DatabasePath)
	if err != nil {
		return nil, err
	}
	return &App{
		cfg:    cfg,
		logger: logger,
		store:  st,
		tokens: auth.NewTokenManager(cfg.SecretKey, cfg.TokenExpireDays),
	}, nil
}

func (a *App) Close() error { return a.store.Close() }

func (a *App) Router() http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)

	r.Get("/health", func(w http.ResponseWriter, _ *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	r.Route("/api", func(api chi.Router) {
		api.Post("/auth/register", a.handleRegister)
		api.Post("/auth/login", a.handleLogin)
		api.Get("/share/{token}", a.handleGetSharedBook)

		api.Group(func(protected chi.Router) {
			protected.Use(a.requireAuth)
			protected.Get("/auth/me", a.handleMe)

			protected.Get("/skills", a.handleListSkills)

			protected.Get("/stories", a.handleListStories)
			protected.Post("/stories", a.handleCreateStory)
			protected.Get("/stories/{storyID}", a.handleGetStory)
			protected.Patch("/stories/{storyID}", a.handleUpdateStory)
			protected.Delete("/stories/{storyID}", a.handleDeleteStory)

			protected.Post("/stories/{storyID}/share", a.handleCreateShare)
			protected.Delete("/stories/{storyID}/share", a.handleDeleteShare)

			protected.Put("/stories/{storyID}/outline", a.handleReplaceOutline)

			protected.Post("/stories/{storyID}/chapters", a.handleCreateChapter)
			protected.Patch("/chapters/{chapterID}", a.handleUpdateChapter)
			protected.Delete("/chapters/{chapterID}", a.handleDeleteChapter)

			protected.Post("/stories/{storyID}/entities", a.handleCreateEntity)
			protected.Patch("/entities/{entityID}", a.handleUpdateEntity)
			protected.Delete("/entities/{entityID}", a.handleDeleteEntity)

			protected.Get("/stories/{storyID}/coach/{skill}", a.handleCoachHistory)
			protected.Post("/stories/{storyID}/coach", a.handleCoach)
		})
	})

	return r
}

// --- auth middleware ---

type ctxKey string

const userIDKey ctxKey = "userID"

func (a *App) requireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		token := strings.TrimPrefix(header, "Bearer ")
		if token == "" || token == header {
			writeError(w, http.StatusUnauthorized, "missing token")
			return
		}
		claims, err := a.tokens.Parse(token)
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func userID(r *http.Request) int64 {
	id, _ := r.Context().Value(userIDKey).(int64)
	return id
}

// --- helpers ---

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func writeStoreError(w http.ResponseWriter, err error) {
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	writeError(w, http.StatusInternalServerError, "internal error")
}

func decode(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}
