'use client';

import { useState, useEffect, useRef } from 'react';
import { Message } from '../../types';
import MessageBubble from './MessageBubble';

interface MessageGroupProps {
  date: string;
  messages: Message[];
  currentUserId: string;
  users: any[];
  getSenderId: (sender: any) => string;
  onReactionSelect?: (messageId: string, reaction: string) => void;
  onReplyClick?: (messageId: string) => void;
  getMessageReactions?: (messageId: string) => Array<{ emoji: string; count: number }>;
}

export default function MessageGroup({ 
  date, 
  messages, 
  currentUserId, 
  users, 
  getSenderId,
  onReactionSelect,
  onReplyClick,
  getMessageReactions
}: MessageGroupProps) {
  const [isSticky, setIsSticky] = useState(false);
  const dateRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'TODAY';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'YESTERDAY';
    } else {
      const options: Intl.DateTimeFormatOptions = { 
        month: 'short', 
        day: 'numeric',
      };
      
      if (new Date().getFullYear() !== date.getFullYear()) {
        options.year = 'numeric';
      }
      
      return date.toLocaleDateString('en-US', options).toUpperCase();
    }
  };

  // Sticky date header effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0.1, rootMargin: '-60px 0px 0px 0px' }
    );

    if (dateRef.current) {
      observer.observe(dateRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Improved grouping logic - messages from same sender within 5 minutes
  const groupMessages = (messages: Message[]) => {
    if (messages.length === 0) return [];
    
    const groups = [];
    let currentGroup = [messages[0]];
    
    for (let i = 1; i < messages.length; i++) {
      const currentMessage = messages[i];
      const previousMessage = messages[i - 1];
      
      const currentSender = getSenderId(currentMessage.sender);
      const previousSender = getSenderId(previousMessage.sender);
      
      const currentTime = new Date(currentMessage.createdAt).getTime();
      const previousTime = new Date(previousMessage.createdAt).getTime();
      const timeDiff = (currentTime - previousTime) / (1000 * 60); // minutes
      
      // Group if same sender AND within 5 minutes (more relaxed than before)
      if (currentSender === previousSender && timeDiff < 5) {
        currentGroup.push(currentMessage);
      } else {
        groups.push(currentGroup);
        currentGroup = [currentMessage];
      }
    }
    
    // Push the last group
    groups.push(currentGroup);
    
    return groups;
  };

  const messageGroups = groupMessages(messages);

  if (messages.length === 0) return null;

  return (
    <div className="mb-2 relative">
      {/* Static date marker for observer */}
      <div ref={dateRef} className="absolute -top-8 h-2 w-full"></div>
      
      {/* Telegram-style date separator */}
      <div className={`${isSticky ? 'fixed top-16 left-1/2 transform -translate-x-1/2 z-20' : 'relative'} flex justify-center mb-1 transition-all duration-200`}>
        <div className={`${isSticky ? 'shadow-lg animate-pulse-slow' : ''} bg-gray-300/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-full px-4 py-1.5 border border-gray-300/50 dark:border-zinc-700/50`}>
          <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
            {formatDate(date)}
          </span>
        </div>
      </div>
      
      {/* Message Groups - Compact styling */}
      <div className="space-y-[0.15rem]">
        {messageGroups.map((group, groupIndex) => {
          const isCurrentUser = getSenderId(group[0].sender) === currentUserId;
          
          return (
            <div 
              key={groupIndex} 
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} px-2 sm:px-3`}
            >
              <div className={`space-y-[0.1rem] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                {group.map((message, messageIndex) => {
                  const isFirstInGroup = messageIndex === 0;
                  const isLastInGroup = messageIndex === group.length - 1;
                  const messageReactions = getMessageReactions 
                    ? getMessageReactions(message._id)
                    : [];

                  return (
                    <MessageBubble
                      key={message._id || `${groupIndex}-${messageIndex}`}
                      message={message}
                      isCurrentUser={isCurrentUser}
                      showStatus={isLastInGroup && isCurrentUser}
                      showTime={isLastInGroup}
                      onReactionSelect={onReactionSelect}
                      onReplyClick={onReplyClick}
                      reactions={messageReactions}
                      isFirstInGroup={isFirstInGroup}
                      isLastInGroup={isLastInGroup}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
