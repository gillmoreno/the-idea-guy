package api

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"

	"inkanto/go-backend/internal/store"
)

var allowedSkills = map[string]bool{
	"scintilla":  true,
	"architetto": true,
	"intervista": true,
	"e-poi":      true,
	"dottore":    true,
	"voce":       true,
}

// handleListSkills proxies the sidecar's skill catalog so the frontend has one origin.
func (a *App) handleListSkills(w http.ResponseWriter, r *http.Request) {
	resp, err := http.Get(a.cfg.SidecarURL + "/skills")
	if err != nil {
		writeError(w, http.StatusBadGateway, "ai sidecar unavailable")
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

func (a *App) handleCoachHistory(w http.ResponseWriter, r *http.Request) {
	st, ok := a.storyForUser(w, r)
	if !ok {
		return
	}
	skill := pathParam(r, "skill")
	if !allowedSkills[skill] {
		writeError(w, http.StatusBadRequest, "unknown skill")
		return
	}
	msgs, err := a.store.RecentCoachMessages(st.ID, skill, 50)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, msgs)
}

type coachRequest struct {
	Skill     string `json:"skill"`
	Message   string `json:"message"`
	ChapterID int64  `json:"chapter_id,omitempty"`
	EntityID  int64  `json:"entity_id,omitempty"`
}

type sidecarRequest struct {
	Skill   string            `json:"skill"`
	Locale  string            `json:"locale"`
	Context string            `json:"context"`
	History []sidecarTurn     `json:"history"`
	Message string            `json:"message"`
	Meta    map[string]string `json:"meta,omitempty"`
}

type sidecarTurn struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// handleCoach streams the coach's reply as SSE while persisting the exchange.
func (a *App) handleCoach(w http.ResponseWriter, r *http.Request) {
	st, ok := a.storyForUser(w, r)
	if !ok {
		return
	}
	var req coachRequest
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if !allowedSkills[req.Skill] {
		writeError(w, http.StatusBadRequest, "unknown skill")
		return
	}
	req.Message = strings.TrimSpace(req.Message)
	if req.Message == "" {
		writeError(w, http.StatusBadRequest, "message is required")
		return
	}

	user, err := a.store.GetUserByID(userID(r))
	if err != nil {
		writeStoreError(w, err)
		return
	}

	storyContext, err := a.buildStoryContext(st, req, userID(r))
	if err != nil {
		writeStoreError(w, err)
		return
	}

	history := []sidecarTurn{}
	if recent, err := a.store.RecentCoachMessages(st.ID, req.Skill, 12); err == nil {
		for _, m := range recent {
			history = append(history, sidecarTurn{Role: m.Role, Content: m.Content})
		}
	}

	payload, _ := json.Marshal(sidecarRequest{
		Skill:   req.Skill,
		Locale:  user.Locale,
		Context: storyContext,
		History: history,
		Message: req.Message,
	})

	sidecarReq, err := http.NewRequestWithContext(r.Context(), http.MethodPost, a.cfg.SidecarURL+"/coach", bytes.NewReader(payload))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}
	sidecarReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 5 * time.Minute}
	resp, err := client.Do(sidecarReq)
	if err != nil {
		writeError(w, http.StatusBadGateway, "ai sidecar unavailable")
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		a.logger.Printf("sidecar error %d: %s", resp.StatusCode, body)
		writeError(w, http.StatusBadGateway, "ai sidecar error")
		return
	}

	// The user turn is persisted only once the sidecar accepted the request,
	// so a dead sidecar doesn't pollute the conversation history.
	a.store.AddCoachMessage(st.ID, req.Skill, "user", req.Message)

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	flusher, canFlush := w.(http.Flusher)

	var full strings.Builder
	scanner := bufio.NewScanner(resp.Body)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	for scanner.Scan() {
		line := scanner.Text()
		fmt.Fprintf(w, "%s\n", line)
		if canFlush && line == "" {
			flusher.Flush()
		}
		if data, ok := strings.CutPrefix(line, "data: "); ok {
			var chunk struct {
				Text string `json:"text"`
			}
			if json.Unmarshal([]byte(data), &chunk) == nil && chunk.Text != "" {
				full.WriteString(chunk.Text)
			}
		}
	}

	if full.Len() > 0 {
		a.store.AddCoachMessage(st.ID, req.Skill, "assistant", full.String())
	}
}

// buildStoryContext flattens everything the coach should know into one text block.
func (a *App) buildStoryContext(st *store.Story, req coachRequest, uid int64) (string, error) {
	var b strings.Builder
	fmt.Fprintf(&b, "TITOLO: %s\n", st.Title)
	if st.Idea != "" {
		fmt.Fprintf(&b, "IDEA DELLA STORIA: %s\n", st.Idea)
	}
	if st.Voice != "" {
		fmt.Fprintf(&b, "VOCE DELLA STORIA (tono, narratore, stile scelti dalla scrittrice — rispettala in ogni consiglio): %s\n", st.Voice)
	}

	beats, err := a.store.ListBeats(st.ID)
	if err != nil {
		return "", err
	}
	if len(beats) > 0 {
		b.WriteString("\nSCALETTA:\n")
		for _, beat := range beats {
			fmt.Fprintf(&b, "%d. %s — %s\n", beat.Position+1, beat.Title, beat.Summary)
		}
	}

	entities, err := a.store.ListEntities(st.ID)
	if err != nil {
		return "", err
	}
	if len(entities) > 0 {
		b.WriteString("\nMONDO DELLA STORIA:\n")
		for _, e := range entities {
			fmt.Fprintf(&b, "- [%s] %s: %s\n", e.Kind, e.Name, e.Summary)
		}
	}

	chapters, err := a.store.ListChapters(st.ID)
	if err != nil {
		return "", err
	}
	if len(chapters) > 0 {
		b.WriteString("\nCAPITOLI:\n")
		for _, c := range chapters {
			fmt.Fprintf(&b, "%d. %s (%s, %d caratteri)\n", c.Position+1, c.Title, c.Status, len(c.Content))
		}
	}

	if req.ChapterID != 0 {
		if ch, err := a.store.GetChapterForUser(req.ChapterID, uid); err == nil && ch.StoryID == st.ID {
			fmt.Fprintf(&b, "\nCAPITOLO SU CUI STA LAVORANDO (\"%s\"):\n%s\n", ch.Title, truncate(ch.Content, 6000))
		}
	}
	if req.EntityID != 0 {
		if e, err := a.store.GetEntityForUser(req.EntityID, uid); err == nil && e.StoryID == st.ID {
			fmt.Fprintf(&b, "\nELEMENTO IN FOCUS: [%s] %s\n%s\nNOTE: %s\n", e.Kind, e.Name, e.Summary, e.Notes)
		}
	}

	return b.String(), nil
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return "…" + s[len(s)-max:]
}

func pathParam(r *http.Request, name string) string {
	return chi.URLParam(r, name)
}
