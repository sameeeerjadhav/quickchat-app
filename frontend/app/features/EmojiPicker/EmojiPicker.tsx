// frontend/app/features/EmojiPicker/EmojiPicker.tsx
'use client';

import { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { FiSmile } from 'react-icons/fi';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export default function EmojiPickerComponent({ onEmojiSelect }: EmojiPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleEmojiSelect = (emojiObject: any) => {
    // Different library versions return data differently
    const emoji = emojiObject.emoji || emojiObject.native || emojiObject;
    onEmojiSelect(emoji);
    setShowPicker(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FiSmile className="h-5 w-5" />
      </button>

      {showPicker && (
        <>
          {/* Emoji Picker */}
          <div className="absolute bottom-12 right-0 z-50 shadow-xl rounded-lg overflow-hidden">
            <EmojiPicker
              onEmojiClick={handleEmojiSelect}  // Try 'onEmojiClick' instead
            />
          </div>
          
          {/* Close when clicking outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPicker(false)}
          />
        </>
      )}
    </div>
  );
}