package api

import (
	"errors"
	"net/http"
	"strings"

	"inkanto/go-backend/internal/auth"
	"inkanto/go-backend/internal/store"
)

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func (a *App) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	user, err := a.store.GetUserByUsername(strings.TrimSpace(strings.ToLower(req.Username)))
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			writeError(w, http.StatusUnauthorized, "wrong username or password")
			return
		}
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	if !auth.CheckPassword(user.PasswordHash, req.Password) {
		writeError(w, http.StatusUnauthorized, "wrong username or password")
		return
	}
	token, err := a.tokens.NewToken(user.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"token": token, "user": user})
}

func (a *App) handleMe(w http.ResponseWriter, r *http.Request) {
	user, err := a.store.GetUserByID(userID(r))
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, user)
}
