package api

import (
	"errors"
	"net/http"
	"strings"

	"inkanto/go-backend/internal/auth"
	"inkanto/go-backend/internal/store"
)

type registerRequest struct {
	Username    string `json:"username"`
	Password    string `json:"password"`
	DisplayName string `json:"display_name"`
	Locale      string `json:"locale"`
	FamilyCode  string `json:"family_code"`
}

func (a *App) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	req.Username = strings.TrimSpace(strings.ToLower(req.Username))
	if req.Username == "" || len(req.Password) < 4 {
		writeError(w, http.StatusBadRequest, "username and a password of at least 4 characters are required")
		return
	}
	if req.FamilyCode != a.cfg.FamilyCode {
		writeError(w, http.StatusForbidden, "wrong family code")
		return
	}
	if req.Locale == "" {
		req.Locale = "it"
	}
	if req.DisplayName == "" {
		req.DisplayName = req.Username
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	id, err := a.store.CreateUser(req.Username, hash, req.DisplayName, req.Locale)
	if err != nil {
		writeError(w, http.StatusConflict, "username already taken")
		return
	}
	token, err := a.tokens.NewToken(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	user, _ := a.store.GetUserByID(id)
	writeJSON(w, http.StatusCreated, map[string]any{"token": token, "user": user})
}

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
