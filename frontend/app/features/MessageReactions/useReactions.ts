// frontend/app/features/MessageReactions/useReactions.ts
import { useState } from 'react';

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
  messageId: string;
}

export function useReactions() {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const addReaction = (messageId: string, emoji: string, userId: string) => {
    const newReaction = {
      id: `react-${Date.now()}`,
      emoji,
      userId,
      messageId,
    };
    setReactions(prev => [...prev, newReaction]);
    return newReaction;
  };

  const removeReaction = (reactionId: string) => {
    setReactions(prev => prev.filter(r => r.id !== reactionId));
  };

  const getMessageReactions = (messageId: string) => {
    return reactions.filter(r => r.messageId === messageId);
  };

  const getUserReaction = (messageId: string, userId: string) => {
    return reactions.find(r => r.messageId === messageId && r.userId === userId);
  };

  return {
    reactions,
    addReaction,
    removeReaction,
    getMessageReactions,
    getUserReaction,
  };
}