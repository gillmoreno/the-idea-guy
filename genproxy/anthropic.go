package main

import (
	"context"
	"errors"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

// newAnthropicClient builds the SDK client for GENPROXY_PROVIDER=anthropic.
// baseURL override exists for tests.
func newAnthropicClient(cfg config) anthropic.Client {
	opts := []option.RequestOption{option.WithAPIKey(cfg.apiKey)}
	if cfg.anthropicBaseURL != "" {
		opts = append(opts, option.WithBaseURL(cfg.anthropicBaseURL))
	}
	return anthropic.NewClient(opts...)
}

// callAnthropic runs one generation through the Claude Messages API and
// returns the text plus token usage for the spend meter.
func (s *server) callAnthropic(ctx context.Context, description string) (string, int64, int64, error) {
	resp, err := s.anthropic.Messages.New(ctx, anthropic.MessageNewParams{
		Model:     anthropic.Model(s.cfg.model),
		MaxTokens: int64(s.cfg.maxTokens),
		System:    []anthropic.TextBlockParam{{Text: systemPrompt}},
		Messages: []anthropic.MessageParam{
			anthropic.NewUserMessage(anthropic.NewTextBlock(description)),
		},
	})
	if err != nil {
		return "", 0, 0, err
	}
	for _, block := range resp.Content {
		if text, ok := block.AsAny().(anthropic.TextBlock); ok {
			return text.Text, resp.Usage.InputTokens, resp.Usage.OutputTokens, nil
		}
	}
	return "", resp.Usage.InputTokens, resp.Usage.OutputTokens, errors.New("anthropic response had no text block")
}
