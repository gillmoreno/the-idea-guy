package api

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"

	"inkanto/go-backend/internal/store"
)

func pathID(r *http.Request, name string) int64 {
	id, _ := strconv.ParseInt(chi.URLParam(r, name), 10, 64)
	return id
}

// storyForUser loads the story and enforces ownership in one place.
func (a *App) storyForUser(w http.ResponseWriter, r *http.Request) (*store.Story, bool) {
	st, err := a.store.GetStory(pathID(r, "storyID"), userID(r))
	if err != nil {
		writeStoreError(w, err)
		return nil, false
	}
	return st, true
}

// storyDetail is the full payload the story page needs in one request.
type storyDetail struct {
	*store.Story
	Beats    []store.Beat    `json:"beats"`
	Chapters []store.Chapter `json:"chapters"`
	Entities []store.Entity  `json:"entities"`
}

func (a *App) handleListStories(w http.ResponseWriter, r *http.Request) {
	stories, err := a.store.ListStories(userID(r))
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, stories)
}

func (a *App) handleCreateStory(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title string `json:"title"`
		Idea  string `json:"idea"`
	}
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Title == "" {
		req.Title = "Storia senza titolo"
	}
	st, err := a.store.CreateStory(userID(r), req.Title, req.Idea)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, st)
}

func (a *App) handleGetStory(w http.ResponseWriter, r *http.Request) {
	st, ok := a.storyForUser(w, r)
	if !ok {
		return
	}
	beats, err := a.store.ListBeats(st.ID)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	chapters, err := a.store.ListChapters(st.ID)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	entities, err := a.store.ListEntities(st.ID)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, storyDetail{Story: st, Beats: beats, Chapters: chapters, Entities: entities})
}

func (a *App) handleUpdateStory(w http.ResponseWriter, r *http.Request) {
	st, ok := a.storyForUser(w, r)
	if !ok {
		return
	}
	// Patch semantics: start from current values, overwrite what the body provides.
	req := struct {
		Title  *string `json:"title"`
		Idea   *string `json:"idea"`
		Voice  *string `json:"voice"`
		Status *string `json:"status"`
	}{}
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Title != nil {
		st.Title = *req.Title
	}
	if req.Idea != nil {
		st.Idea = *req.Idea
	}
	if req.Voice != nil {
		st.Voice = *req.Voice
	}
	if req.Status != nil {
		st.Status = *req.Status
	}
	if err := a.store.UpdateStory(st.ID, userID(r), st.Title, st.Idea, st.Voice, st.Status); err != nil {
		writeStoreError(w, err)
		return
	}
	updated, _ := a.store.GetStory(st.ID, userID(r))
	writeJSON(w, http.StatusOK, updated)
}

func (a *App) handleDeleteStory(w http.ResponseWriter, r *http.Request) {
	if err := a.store.DeleteStory(pathID(r, "storyID"), userID(r)); err != nil {
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *App) handleReplaceOutline(w http.ResponseWriter, r *http.Request) {
	st, ok := a.storyForUser(w, r)
	if !ok {
		return
	}
	var req struct {
		Beats []store.Beat `json:"beats"`
	}
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if err := a.store.ReplaceBeats(st.ID, req.Beats); err != nil {
		writeStoreError(w, err)
		return
	}
	beats, err := a.store.ListBeats(st.ID)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, beats)
}

func (a *App) handleCreateChapter(w http.ResponseWriter, r *http.Request) {
	st, ok := a.storyForUser(w, r)
	if !ok {
		return
	}
	var req struct {
		Title string `json:"title"`
	}
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	ch, err := a.store.CreateChapter(st.ID, req.Title)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, ch)
}

func (a *App) handleUpdateChapter(w http.ResponseWriter, r *http.Request) {
	current, err := a.store.GetChapterForUser(pathID(r, "chapterID"), userID(r))
	if err != nil {
		writeStoreError(w, err)
		return
	}
	req := struct {
		Title   *string `json:"title"`
		Content *string `json:"content"`
		Status  *string `json:"status"`
	}{}
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Title != nil {
		current.Title = *req.Title
	}
	if req.Content != nil {
		current.Content = *req.Content
	}
	if req.Status != nil {
		current.Status = *req.Status
	}
	ch, err := a.store.UpdateChapter(current.ID, userID(r), current.Title, current.Content, current.Status)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, ch)
}

func (a *App) handleDeleteChapter(w http.ResponseWriter, r *http.Request) {
	if err := a.store.DeleteChapter(pathID(r, "chapterID"), userID(r)); err != nil {
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (a *App) handleCreateEntity(w http.ResponseWriter, r *http.Request) {
	st, ok := a.storyForUser(w, r)
	if !ok {
		return
	}
	var req struct {
		Kind    string `json:"kind"`
		Name    string `json:"name"`
		Summary string `json:"summary"`
	}
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	switch req.Kind {
	case "character", "place", "object":
	default:
		writeError(w, http.StatusBadRequest, "kind must be character, place or object")
		return
	}
	e, err := a.store.CreateEntity(st.ID, req.Kind, req.Name, req.Summary)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, e)
}

func (a *App) handleUpdateEntity(w http.ResponseWriter, r *http.Request) {
	current, err := a.store.GetEntityForUser(pathID(r, "entityID"), userID(r))
	if err != nil {
		writeStoreError(w, err)
		return
	}
	req := struct {
		Name    *string `json:"name"`
		Summary *string `json:"summary"`
		Notes   *string `json:"notes"`
	}{}
	if err := decode(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid body")
		return
	}
	if req.Name != nil {
		current.Name = *req.Name
	}
	if req.Summary != nil {
		current.Summary = *req.Summary
	}
	if req.Notes != nil {
		current.Notes = *req.Notes
	}
	e, err := a.store.UpdateEntity(current.ID, userID(r), current.Name, current.Summary, current.Notes)
	if err != nil {
		writeStoreError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, e)
}

func (a *App) handleDeleteEntity(w http.ResponseWriter, r *http.Request) {
	if err := a.store.DeleteEntity(pathID(r, "entityID"), userID(r)); err != nil {
		writeStoreError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
