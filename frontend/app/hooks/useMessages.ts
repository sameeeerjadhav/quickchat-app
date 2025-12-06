// frontend/app/hooks/useMessage.ts
import { useState } from 'react';
import { messageAPI } from '../../lib/api';
import { Message } from '../../types';

export function useMessage(currentUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  const fetchMessages = async (userId: string) => {
    try {
      const response = await messageAPI.getChat(userId);
      
      let messagesArray: any[] = [];
      
      if (response.data && Array.isArray(response.data)) {
        messagesArray = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        messagesArray = response.data.data;
      }
      
      const filteredMessages = messagesArray.filter((msg: any) => {
        const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
        const receiverId = typeof msg.receiver === 'object' ? msg.receiver._id : msg.receiver;
        
        return (senderId === currentUserId && receiverId === userId) ||
               (senderId === userId && receiverId === currentUserId);
      });
      
      const sorted = filteredMessages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      setMessages(sorted);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    }
  };

  const sendMessage = async (receiverId: string, content: string) => {
    if (!content.trim() || !currentUserId) return null;
    
    setSending(true);
    try {
      const response = await messageAPI.send({
        receiverId,
        content: content.trim()
      });
      
      // Refresh messages after sending
      setTimeout(() => {
        fetchMessages(receiverId);
      }, 300);
      
      return response.data;
    } catch (err) {
      console.error('Failed to send message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  return {
    messages,
    sending,
    fetchMessages,
    sendMessage,
    setMessages
  };
}