package content

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

type Snippet struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
	URL         string   `json:"url,omitempty"`
}

type BuildLinks struct {
	Demo   string `json:"demo,omitempty"`
	Thread string `json:"thread,omitempty"`
	Repo   string `json:"repo,omitempty"`
}

type Build struct {
	ID          string     `json:"id"`
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Tags        []string   `json:"tags"`
	Learning    string     `json:"learning,omitempty"`
	Links       BuildLinks `json:"links,omitempty"`
	ShippedAt   string     `json:"shippedAt,omitempty"`
	Status      string     `json:"status"`
}

type Idea struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Why    string `json:"why"`
	Status string `json:"status"`
	Link   string `json:"link,omitempty"`
}

type StackItem struct {
	Name string `json:"name"`
	Role string `json:"role"`
}

type StackGroup struct {
	Category string      `json:"category"`
	Items    []StackItem `json:"items"`
}

type WorkflowStep struct {
	Step        int    `json:"step"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type CursorRule struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type Tools struct {
	Stack       []StackGroup   `json:"stack"`
	Workflow    []WorkflowStep `json:"workflow"`
	CursorRules []CursorRule   `json:"cursorRules"`
}

type Store struct {
	dir string
}

func NewStore(dir string) (*Store, error) {
	info, err := os.Stat(dir)
	if err != nil {
		return nil, fmt.Errorf("content dir %q: %w", dir, err)
	}
	if !info.IsDir() {
		return nil, fmt.Errorf("content dir %q is not a directory", dir)
	}

	return &Store{dir: dir}, nil
}

func (s *Store) Snippets() ([]Snippet, error) {
	var items []Snippet
	if err := s.load("snippets.json", &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (s *Store) Builds() ([]Build, error) {
	var items []Build
	if err := s.load("builds.json", &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (s *Store) Ideas() ([]Idea, error) {
	var items []Idea
	if err := s.load("ideas.json", &items); err != nil {
		return nil, err
	}
	return items, nil
}

func (s *Store) Tools() (Tools, error) {
	var tools Tools
	if err := s.load("tools.json", &tools); err != nil {
		return Tools{}, err
	}
	return tools, nil
}

func (s *Store) load(filename string, target any) error {
	path := filepath.Join(s.dir, filename)
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("read %s: %w", filename, err)
	}

	if err := json.Unmarshal(data, target); err != nil {
		return fmt.Errorf("parse %s: %w", filename, err)
	}

	return nil
}

func ResolveDataDir() string {
	if dir := os.Getenv("CONTENT_DIR"); dir != "" {
		return dir
	}

	if dir := os.Getenv("DATA_DIR"); dir != "" {
		return dir
	}

	return "data"
}
