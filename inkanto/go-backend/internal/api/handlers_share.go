package api

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"

	"github.com/go-chi/chi/v5"
)

// handleCreateShare mints (or returns the existing) public share token for a story.
func (a *App) handleCreateShare(w http.ResponseWriter, r *http.Request) {
	st, ok := a.storyForUser(w, r)
	if !ok {
		return
	}
	if st.ShareToken == "" {
		buf := make([]byte, 16)
		if _, err := rand.Read(buf); err != nil {
			writeError(w, http.StatusInternalServerError, "internal error")
			return
		}
		st.ShareToken = hex.EncodeToString(buf)
		if err := a.store.SetShareToken(st.ID, userID(r), st.ShareToken); err != nil {
			writeStoreError(w, err)
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"share_token": st.ShareToken})
}

func (a *App) handleDeleteShare(w http.ResponseWriter, r *http.Request) {
	st, ok := a.storyForUser(w, r)
	if !ok {
		return
	}
	if err := a.store.SetShareToken(st.ID, userID(r), ""); err != nil {
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// handleGetSharedBook is public — anyone with the link can read the book.
func (a *App) handleGetSharedBook(w http.ResponseWriter, r *http.Request) {
	token := chi.URLParam(r, "token")
	if len(token) < 16 {
		writeError(w, http.StatusNotFound, "not found")
		return
	}
	book, err := a.store.GetSharedBook(token)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, book)
}
