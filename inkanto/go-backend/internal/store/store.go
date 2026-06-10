package store

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

var ErrNotFound = errors.New("not found")

type Store struct {
	db *sql.DB
}

type User struct {
	ID           int64  `json:"id"`
	Username     string `json:"username"`
	PasswordHash string `json:"-"`
	DisplayName  string `json:"display_name"`
	Locale       string `json:"locale"`
}

type Story struct {
	ID         int64  `json:"id"`
	UserID     int64  `json:"-"`
	Title      string `json:"title"`
	Idea       string `json:"idea"`
	Voice      string `json:"voice"`
	Status     string `json:"status"`
	ShareToken string `json:"share_token,omitempty"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

// SharedBook is the read-only public payload behind a share link.
type SharedBook struct {
	Title    string    `json:"title"`
	Idea     string    `json:"idea"`
	Author   string    `json:"author"`
	Chapters []Chapter `json:"chapters"`
	Entities []Entity  `json:"entities"`
}

type Beat struct {
	ID       int64  `json:"id"`
	StoryID  int64  `json:"-"`
	Position int    `json:"position"`
	Title    string `json:"title"`
	Summary  string `json:"summary"`
}

type Chapter struct {
	ID        int64  `json:"id"`
	StoryID   int64  `json:"story_id"`
	Position  int    `json:"position"`
	Title     string `json:"title"`
	Content   string `json:"content"`
	Status    string `json:"status"`
	UpdatedAt string `json:"updated_at"`
}

type Entity struct {
	ID      int64  `json:"id"`
	StoryID int64  `json:"story_id"`
	Kind    string `json:"kind"` // character | place | object
	Name    string `json:"name"`
	Summary string `json:"summary"`
	Notes   string `json:"notes"`
}

type CoachMessage struct {
	ID        int64  `json:"id"`
	StoryID   int64  `json:"story_id"`
	Skill     string `json:"skill"`
	Role      string `json:"role"` // user | assistant
	Content   string `json:"content"`
	CreatedAt string `json:"created_at"`
}

func Open(path string) (*Store, error) {
	if dir := filepath.Dir(path); dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, fmt.Errorf("create data dir: %w", err)
		}
	}
	db, err := sql.Open("sqlite", path+"?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)")
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1) // modernc sqlite: serialize writes
	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		db.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) migrate() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	display_name TEXT NOT NULL DEFAULT '',
	locale TEXT NOT NULL DEFAULT 'it',
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS stories (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	title TEXT NOT NULL DEFAULT '',
	idea TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'in_corso',
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS beats (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
	position INTEGER NOT NULL,
	title TEXT NOT NULL DEFAULT '',
	summary TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS chapters (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
	position INTEGER NOT NULL,
	title TEXT NOT NULL DEFAULT '',
	content TEXT NOT NULL DEFAULT '',
	status TEXT NOT NULL DEFAULT 'bozza',
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS entities (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
	kind TEXT NOT NULL CHECK (kind IN ('character','place','object')),
	name TEXT NOT NULL DEFAULT '',
	summary TEXT NOT NULL DEFAULT '',
	notes TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS coach_messages (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	story_id INTEGER NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
	skill TEXT NOT NULL,
	role TEXT NOT NULL CHECK (role IN ('user','assistant')),
	content TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_beats_story ON beats(story_id, position);
CREATE INDEX IF NOT EXISTS idx_chapters_story ON chapters(story_id, position);
CREATE INDEX IF NOT EXISTS idx_entities_story ON entities(story_id);
CREATE INDEX IF NOT EXISTS idx_coach_story ON coach_messages(story_id, skill, id);
`)
	if err != nil {
		return err
	}
	// additive migrations — the ALTERs fail harmlessly when the column already exists
	s.db.Exec(`ALTER TABLE stories ADD COLUMN share_token TEXT`)
	s.db.Exec(`ALTER TABLE stories ADD COLUMN voice TEXT NOT NULL DEFAULT ''`)
	if _, err := s.db.Exec(
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_share ON stories(share_token) WHERE share_token IS NOT NULL`); err != nil {
		return err
	}
	return nil
}

// --- users ---

func (s *Store) CreateUser(username, passwordHash, displayName, locale string) (int64, error) {
	res, err := s.db.Exec(
		`INSERT INTO users (username, password_hash, display_name, locale) VALUES (?, ?, ?, ?)`,
		username, passwordHash, displayName, locale)
	if err != nil {
		return 0, err
	}
	return res.LastInsertId()
}

func (s *Store) GetUserByUsername(username string) (*User, error) {
	u := &User{}
	err := s.db.QueryRow(
		`SELECT id, username, password_hash, display_name, locale FROM users WHERE username = ?`, username).
		Scan(&u.ID, &u.Username, &u.PasswordHash, &u.DisplayName, &u.Locale)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return u, err
}

func (s *Store) GetUserByID(id int64) (*User, error) {
	u := &User{}
	err := s.db.QueryRow(
		`SELECT id, username, password_hash, display_name, locale FROM users WHERE id = ?`, id).
		Scan(&u.ID, &u.Username, &u.PasswordHash, &u.DisplayName, &u.Locale)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return u, err
}

// --- stories ---

func (s *Store) CreateStory(userID int64, title, idea string) (*Story, error) {
	res, err := s.db.Exec(`INSERT INTO stories (user_id, title, idea) VALUES (?, ?, ?)`, userID, title, idea)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	return s.GetStory(id, userID)
}

func (s *Store) ListStories(userID int64) ([]Story, error) {
	rows, err := s.db.Query(
		`SELECT id, user_id, title, idea, status, created_at, updated_at
		 FROM stories WHERE user_id = ? ORDER BY updated_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Story{}
	for rows.Next() {
		var st Story
		if err := rows.Scan(&st.ID, &st.UserID, &st.Title, &st.Idea, &st.Status, &st.CreatedAt, &st.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, st)
	}
	return out, rows.Err()
}

func (s *Store) GetStory(id, userID int64) (*Story, error) {
	st := &Story{}
	err := s.db.QueryRow(
		`SELECT id, user_id, title, idea, COALESCE(voice, ''), status, COALESCE(share_token, ''), created_at, updated_at
		 FROM stories WHERE id = ? AND user_id = ?`, id, userID).
		Scan(&st.ID, &st.UserID, &st.Title, &st.Idea, &st.Voice, &st.Status, &st.ShareToken, &st.CreatedAt, &st.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return st, err
}

// SetShareToken sets (or clears, with token "") the public share token.
func (s *Store) SetShareToken(id, userID int64, token string) error {
	var value any
	if token != "" {
		value = token
	}
	res, err := s.db.Exec(
		`UPDATE stories SET share_token = ? WHERE id = ? AND user_id = ?`, value, id, userID)
	if err != nil {
		return err
	}
	return checkAffected(res)
}

// GetSharedBook resolves a share token into the public book payload.
func (s *Store) GetSharedBook(token string) (*SharedBook, error) {
	book := &SharedBook{}
	var storyID int64
	err := s.db.QueryRow(
		`SELECT st.id, st.title, st.idea, u.display_name
		 FROM stories st JOIN users u ON u.id = st.user_id
		 WHERE st.share_token = ?`, token).
		Scan(&storyID, &book.Title, &book.Idea, &book.Author)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if book.Chapters, err = s.ListChapters(storyID); err != nil {
		return nil, err
	}
	if book.Entities, err = s.ListEntities(storyID); err != nil {
		return nil, err
	}
	return book, nil
}

func (s *Store) UpdateStory(id, userID int64, title, idea, voice, status string) error {
	res, err := s.db.Exec(
		`UPDATE stories SET title = ?, idea = ?, voice = ?, status = ?, updated_at = datetime('now')
		 WHERE id = ? AND user_id = ?`, title, idea, voice, status, id, userID)
	if err != nil {
		return err
	}
	return checkAffected(res)
}

func (s *Store) DeleteStory(id, userID int64) error {
	res, err := s.db.Exec(`DELETE FROM stories WHERE id = ? AND user_id = ?`, id, userID)
	if err != nil {
		return err
	}
	return checkAffected(res)
}

func (s *Store) touchStory(storyID int64) {
	s.db.Exec(`UPDATE stories SET updated_at = datetime('now') WHERE id = ?`, storyID)
}

// --- beats ---

func (s *Store) ListBeats(storyID int64) ([]Beat, error) {
	rows, err := s.db.Query(
		`SELECT id, story_id, position, title, summary FROM beats WHERE story_id = ? ORDER BY position`, storyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Beat{}
	for rows.Next() {
		var b Beat
		if err := rows.Scan(&b.ID, &b.StoryID, &b.Position, &b.Title, &b.Summary); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

// ReplaceBeats swaps the whole outline atomically — the editor saves it as one list.
func (s *Store) ReplaceBeats(storyID int64, beats []Beat) error {
	tx, err := s.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`DELETE FROM beats WHERE story_id = ?`, storyID); err != nil {
		return err
	}
	for i, b := range beats {
		if _, err := tx.Exec(
			`INSERT INTO beats (story_id, position, title, summary) VALUES (?, ?, ?, ?)`,
			storyID, i, b.Title, b.Summary); err != nil {
			return err
		}
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	s.touchStory(storyID)
	return nil
}

// --- chapters ---

func (s *Store) CreateChapter(storyID int64, title string) (*Chapter, error) {
	res, err := s.db.Exec(
		`INSERT INTO chapters (story_id, position, title)
		 VALUES (?, COALESCE((SELECT MAX(position)+1 FROM chapters WHERE story_id = ?), 0), ?)`,
		storyID, storyID, title)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	s.touchStory(storyID)
	return s.getChapter(id)
}

func (s *Store) ListChapters(storyID int64) ([]Chapter, error) {
	rows, err := s.db.Query(
		`SELECT id, story_id, position, title, content, status, updated_at
		 FROM chapters WHERE story_id = ? ORDER BY position`, storyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Chapter{}
	for rows.Next() {
		var c Chapter
		if err := rows.Scan(&c.ID, &c.StoryID, &c.Position, &c.Title, &c.Content, &c.Status, &c.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (s *Store) getChapter(id int64) (*Chapter, error) {
	c := &Chapter{}
	err := s.db.QueryRow(
		`SELECT id, story_id, position, title, content, status, updated_at FROM chapters WHERE id = ?`, id).
		Scan(&c.ID, &c.StoryID, &c.Position, &c.Title, &c.Content, &c.Status, &c.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return c, err
}

// GetChapterForUser returns the chapter only if its story belongs to the user.
func (s *Store) GetChapterForUser(id, userID int64) (*Chapter, error) {
	c := &Chapter{}
	err := s.db.QueryRow(
		`SELECT c.id, c.story_id, c.position, c.title, c.content, c.status, c.updated_at
		 FROM chapters c JOIN stories st ON st.id = c.story_id
		 WHERE c.id = ? AND st.user_id = ?`, id, userID).
		Scan(&c.ID, &c.StoryID, &c.Position, &c.Title, &c.Content, &c.Status, &c.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return c, err
}

func (s *Store) UpdateChapter(id, userID int64, title, content, status string) (*Chapter, error) {
	res, err := s.db.Exec(
		`UPDATE chapters SET title = ?, content = ?, status = ?, updated_at = datetime('now')
		 WHERE id = ? AND story_id IN (SELECT id FROM stories WHERE user_id = ?)`,
		title, content, status, id, userID)
	if err != nil {
		return nil, err
	}
	if err := checkAffected(res); err != nil {
		return nil, err
	}
	c, err := s.getChapter(id)
	if err == nil {
		s.touchStory(c.StoryID)
	}
	return c, err
}

func (s *Store) DeleteChapter(id, userID int64) error {
	res, err := s.db.Exec(
		`DELETE FROM chapters WHERE id = ? AND story_id IN (SELECT id FROM stories WHERE user_id = ?)`,
		id, userID)
	if err != nil {
		return err
	}
	return checkAffected(res)
}

// --- entities (story bible) ---

func (s *Store) CreateEntity(storyID int64, kind, name, summary string) (*Entity, error) {
	res, err := s.db.Exec(
		`INSERT INTO entities (story_id, kind, name, summary) VALUES (?, ?, ?, ?)`,
		storyID, kind, name, summary)
	if err != nil {
		return nil, err
	}
	id, _ := res.LastInsertId()
	s.touchStory(storyID)
	return s.getEntity(id)
}

func (s *Store) ListEntities(storyID int64) ([]Entity, error) {
	rows, err := s.db.Query(
		`SELECT id, story_id, kind, name, summary, notes FROM entities WHERE story_id = ? ORDER BY kind, name`, storyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Entity{}
	for rows.Next() {
		var e Entity
		if err := rows.Scan(&e.ID, &e.StoryID, &e.Kind, &e.Name, &e.Summary, &e.Notes); err != nil {
			return nil, err
		}
		out = append(out, e)
	}
	return out, rows.Err()
}

func (s *Store) getEntity(id int64) (*Entity, error) {
	e := &Entity{}
	err := s.db.QueryRow(
		`SELECT id, story_id, kind, name, summary, notes FROM entities WHERE id = ?`, id).
		Scan(&e.ID, &e.StoryID, &e.Kind, &e.Name, &e.Summary, &e.Notes)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return e, err
}

func (s *Store) GetEntityForUser(id, userID int64) (*Entity, error) {
	e := &Entity{}
	err := s.db.QueryRow(
		`SELECT e.id, e.story_id, e.kind, e.name, e.summary, e.notes
		 FROM entities e JOIN stories st ON st.id = e.story_id
		 WHERE e.id = ? AND st.user_id = ?`, id, userID).
		Scan(&e.ID, &e.StoryID, &e.Kind, &e.Name, &e.Summary, &e.Notes)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return e, err
}

func (s *Store) UpdateEntity(id, userID int64, name, summary, notes string) (*Entity, error) {
	res, err := s.db.Exec(
		`UPDATE entities SET name = ?, summary = ?, notes = ?
		 WHERE id = ? AND story_id IN (SELECT id FROM stories WHERE user_id = ?)`,
		name, summary, notes, id, userID)
	if err != nil {
		return nil, err
	}
	if err := checkAffected(res); err != nil {
		return nil, err
	}
	return s.getEntity(id)
}

func (s *Store) DeleteEntity(id, userID int64) error {
	res, err := s.db.Exec(
		`DELETE FROM entities WHERE id = ? AND story_id IN (SELECT id FROM stories WHERE user_id = ?)`,
		id, userID)
	if err != nil {
		return err
	}
	return checkAffected(res)
}

// --- coach messages ---

func (s *Store) AddCoachMessage(storyID int64, skill, role, content string) error {
	_, err := s.db.Exec(
		`INSERT INTO coach_messages (story_id, skill, role, content) VALUES (?, ?, ?, ?)`,
		storyID, skill, role, content)
	return err
}

// RecentCoachMessages returns the last n messages for a story+skill in chronological order.
func (s *Store) RecentCoachMessages(storyID int64, skill string, n int) ([]CoachMessage, error) {
	rows, err := s.db.Query(
		`SELECT id, story_id, skill, role, content, created_at FROM (
			SELECT * FROM coach_messages WHERE story_id = ? AND skill = ? ORDER BY id DESC LIMIT ?
		 ) ORDER BY id ASC`, storyID, skill, n)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []CoachMessage{}
	for rows.Next() {
		var m CoachMessage
		if err := rows.Scan(&m.ID, &m.StoryID, &m.Skill, &m.Role, &m.Content, &m.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

func checkAffected(res sql.Result) error {
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
