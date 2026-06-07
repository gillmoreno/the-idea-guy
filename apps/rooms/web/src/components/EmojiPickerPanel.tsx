"use client";

import EmojiPicker, {
  EmojiStyle,
  SuggestionMode,
  Theme,
  type EmojiClickData,
} from "emoji-picker-react";

export function EmojiPickerPanel({
  theme,
  onSelect,
}: {
  theme: Theme;
  onSelect: (emoji: string) => void;
}) {
  const handleClick = (data: EmojiClickData) => {
    onSelect(data.emoji);
  };

  return (
    <EmojiPicker
      className="rooms-emoji-panel"
      onEmojiClick={handleClick}
      theme={theme}
      emojiStyle={EmojiStyle.NATIVE}
      lazyLoadEmojis
      autoFocusSearch={false}
      suggestedEmojisMode={SuggestionMode.RECENT}
      searchPlaceholder="Search emoji"
      previewConfig={{ showPreview: false }}
      width="100%"
      height={380}
    />
  );
}
