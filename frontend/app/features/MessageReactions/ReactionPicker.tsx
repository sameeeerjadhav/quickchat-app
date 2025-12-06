// frontend/app/features/MessageReactions/ReactionPicker.tsx
'use client';

import { useState } from 'react';
import { FiSmile } from 'react-icons/fi';

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😠', label: 'Angry' },
];

interface ReactionPickerProps {
  messageId: string;
  onReactionSelect: (messageId: string, reaction: string) => void;
}

export default function ReactionPicker({ 
  messageId, 
  onReactionSelect 
}: ReactionPickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const handleReaction = (reaction: string) => {
    onReactionSelect(messageId, reaction);
    setShowPicker(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all"
        title="Add reaction"
      >
        <FiSmile className="h-3.5 w-3.5" />
      </button>

      {showPicker && (
        <>
          <div className="absolute bottom-6 left-0 z-50">
            <div className="flex items-center gap-1 bg-white rounded-full shadow-lg border border-gray-200 px-2 py-1.5">
              {REACTIONS.map((reaction) => (
                <button
                  key={reaction.emoji}
                  type="button"
                  onClick={() => handleReaction(reaction.emoji)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors transform hover:scale-110"
                  title={reaction.label}
                >
                  <span className="text-lg">{reaction.emoji}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPicker(false)}
          />
        </>
      )}
    </div>
  );
}