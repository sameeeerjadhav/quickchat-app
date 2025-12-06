// frontend/app/features/EmojiPicker/useEmojiPicker.ts
import { useState } from 'react';

export function useEmojiPicker() {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const addEmoji = (message: string, emoji: string): string => {
    return message + emoji;
  };

  return {
    showEmojiPicker,
    setShowEmojiPicker,
    addEmoji
  };
}