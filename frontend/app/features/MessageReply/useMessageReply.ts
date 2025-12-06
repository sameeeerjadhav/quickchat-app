// app/chat/features/MessageReply/useMessageReply.ts
import { useState, useCallback } from 'react';

interface ReplyTo {
  messageId: string;
  text: string;
  senderId: string;
  senderName: string;
}

export const useMessageReply = () => {
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);

  const setReply = useCallback((message: ReplyTo) => {
    setReplyTo(message);
  }, []);

  const clearReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const getReplyMessage = useCallback((): string => {
    if (!replyTo) return '';
    
    const sender = replyTo.senderId === 'current-user' ? 'You' : replyTo.senderName;
    const preview = replyTo.text.length > 50 
      ? replyTo.text.substring(0, 47) + '...' 
      : replyTo.text;
    
    return `↪️ Replying to ${sender}: "${preview}"\n\n`;
  }, [replyTo]);

  const prepareMessageWithReply = useCallback((messageText: string): string => {
    if (!replyTo) return messageText;
    return getReplyMessage() + messageText;
  }, [replyTo, getReplyMessage]);

  return {
    replyTo,
    setReply,
    clearReply,
    getReplyMessage,
    prepareMessageWithReply
  };
};