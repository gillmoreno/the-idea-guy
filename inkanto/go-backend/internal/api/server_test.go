package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"inkanto/go-backend/internal/config"
)

func newTestApp(t *testing.T) *App {
	t.Helper()
	cfg := config.Config{
		Port:            0,
		SecretKey:       "test-secret",
		DatabasePath:    filepath.Join(t.TempDir(), "test.sqlite3"),
		SidecarURL:      "http://127.0.0.1:1", // unreachable on purpose
		FamilyCode:      "famiglia",
		TokenExpireDays: 1,
	}
	app, err := NewApp(cfg, log.New(os.Stderr, "test ", 0))
	if err != nil {
		t.Fatalf("NewApp: %v", err)
	}
	t.Cleanup(func() { app.Close() })
	return app
}

func doJSON(t *testing.T, h http.Handler, method, path, token string, body any) (*httptest.ResponseRecorder, map[string]any) {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		json.NewEncoder(&buf).Encode(body)
	}
	req := httptest.NewRequest(method, path, &buf)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	out := map[string]any{}
	json.Unmarshal(rec.Body.Bytes(), &out)
	return rec, out
}

func TestAuthAndStoryFlow(t *testing.T) {
	app := newTestApp(t)
	router := app.Router()

	// wrong family code rejected
	rec, _ := doJSON(t, router, "POST", "/api/auth/register", "", map[string]any{
		"username": "luna", "password": "stelle", "family_code": "sbagliato",
	})
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for wrong family code, got %d", rec.Code)
	}

	// register
	rec, out := doJSON(t, router, "POST", "/api/auth/register", "", map[string]any{
		"username": "luna", "password": "stelle", "family_code": "famiglia", "display_name": "Luna",
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("register: expected 201, got %d (%s)", rec.Code, rec.Body)
	}
	token, _ := out["token"].(string)
	if token == "" {
		t.Fatal("register: missing token")
	}

	// login
	rec, out = doJSON(t, router, "POST", "/api/auth/login", "", map[string]any{
		"username": "luna", "password": "stelle",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("login: expected 200, got %d", rec.Code)
	}
	token = out["token"].(string)

	// unauthorized without token
	rec, _ = doJSON(t, router, "GET", "/api/stories", "", nil)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 without token, got %d", rec.Code)
	}

	// create story
	rec, out = doJSON(t, router, "POST", "/api/stories", token, map[string]any{
		"title": "Il drago timido", "idea": "Un drago che ha paura del buio deve salvare la notte.",
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create story: expected 201, got %d (%s)", rec.Code, rec.Body)
	}
	storyID := int64(out["id"].(float64))
	base := fmt.Sprintf("/api/stories/%d", storyID)

	// outline
	rec, _ = doJSON(t, router, "PUT", base+"/outline", token, map[string]any{
		"beats": []map[string]string{
			{"title": "Inizio", "summary": "Il drago vive in una grotta illuminata."},
			{"title": "Crisi", "summary": "Le stelle si spengono."},
		},
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("outline: expected 200, got %d (%s)", rec.Code, rec.Body)
	}

	// chapter
	rec, out = doJSON(t, router, "POST", base+"/chapters", token, map[string]any{"title": "Capitolo 1"})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create chapter: expected 201, got %d", rec.Code)
	}
	chapterID := int64(out["id"].(float64))
	rec, _ = doJSON(t, router, "PATCH", fmt.Sprintf("/api/chapters/%d", chapterID), token, map[string]any{
		"content": "C'era una volta un drago...",
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("update chapter: expected 200, got %d", rec.Code)
	}

	// entity
	rec, _ = doJSON(t, router, "POST", base+"/entities", token, map[string]any{
		"kind": "character", "name": "Brace", "summary": "Drago timido, ama le lucciole.",
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("create entity: expected 201, got %d", rec.Code)
	}

	// full story detail
	rec, out = doJSON(t, router, "GET", base, token, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("get story: expected 200, got %d", rec.Code)
	}
	if n := len(out["beats"].([]any)); n != 2 {
		t.Fatalf("expected 2 beats, got %d", n)
	}
	if n := len(out["chapters"].([]any)); n != 1 {
		t.Fatalf("expected 1 chapter, got %d", n)
	}
	if n := len(out["entities"].([]any)); n != 1 {
		t.Fatalf("expected 1 entity, got %d", n)
	}

	// second user cannot see luna's story
	_, out2 := doJSON(t, router, "POST", "/api/auth/register", "", map[string]any{
		"username": "nonno", "password": "torta", "family_code": "famiglia",
	})
	otherToken := out2["token"].(string)
	rec, _ = doJSON(t, router, "GET", base, otherToken, nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for other user's story, got %d", rec.Code)
	}

	// share flow: mint token → public read works without auth → revoke → 404
	rec, out = doJSON(t, router, "POST", base+"/share", token, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("create share: expected 200, got %d", rec.Code)
	}
	shareToken := out["share_token"].(string)
	rec, out = doJSON(t, router, "GET", "/api/share/"+shareToken, "", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("public book: expected 200, got %d", rec.Code)
	}
	if out["title"] != "Il drago timido" {
		t.Fatalf("public book: wrong title %v", out["title"])
	}
	if n := len(out["chapters"].([]any)); n != 1 {
		t.Fatalf("public book: expected 1 chapter, got %d", n)
	}
	rec, _ = doJSON(t, router, "DELETE", base+"/share", token, nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("revoke share: expected 204, got %d", rec.Code)
	}
	rec, _ = doJSON(t, router, "GET", "/api/share/"+shareToken, "", nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("revoked share: expected 404, got %d", rec.Code)
	}

	// coach with unreachable sidecar fails cleanly and logs nothing to history
	rec, _ = doJSON(t, router, "POST", base+"/coach", token, map[string]any{
		"skill": "scintilla", "message": "Aiutami!",
	})
	if rec.Code != http.StatusBadGateway {
		t.Fatalf("expected 502 with sidecar down, got %d", rec.Code)
	}
	rec, _ = doJSON(t, router, "GET", base+"/coach/scintilla", token, nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("coach history: expected 200, got %d", rec.Code)
	}
}
