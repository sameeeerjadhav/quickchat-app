'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../../types';
import { FiCheck, FiCheckCircle, FiCopy, FiEdit2, FiTrash2, FiCornerUpLeft, FiDownload, FiPlay } from 'react-icons/fi';
import { MdOutlineEmojiEmotions } from 'react-icons/md';
import { BsReply } from 'react-icons/bs';
import { FaFile, FaFileImage, FaFileVideo, FaFileAudio, FaFilePdf } from 'react-icons/fa';
import VoiceMessage from './VoiceMessage';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
  showStatus?: boolean;
  showTime?: boolean;
  onReactionSelect?: (messageId: string, reaction: string) => void;
  onReplyClick?: (messageId: string) => void;
  reactions?: Array<{ emoji: string; count: number }>;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
}

const MessageBubble = React.memo(function MessageBubble({
  message,
  isCurrentUser,
  showStatus = false,
  showTime = true,
  onReactionSelect,
  onReplyClick,
  reactions = [],
  isFirstInGroup = true,
  isLastInGroup = true
}: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const getStatusIcon = () => {
    if (!showStatus) return null;

    if (message.isRead) {
      return (
        <div className="flex items-center ml-1">
          <FiCheckCircle className="h-3 w-3 text-blue-400" />
          <FiCheckCircle className="h-3 w-3 -ml-2 text-blue-400 opacity-80" />
        </div>
      );
    } else if (message._id && !message._id.startsWith('temp-')) {
      return (
        <div className="flex items-center ml-1">
          <FiCheck className="h-3 w-3 text-gray-400 dark:text-gray-500" />
          <FiCheck className="h-3 w-3 -ml-2 text-gray-400 dark:text-gray-500" />
        </div>
      );
    }
    return null;
  };

  const formatTime = () => {
    const date = new Date(message.createdAt);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const handleReactionSelect = (reaction: string) => {
    if (onReactionSelect) {
      onReactionSelect(message._id, reaction);
    }
    setShowReactions(false);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    setShowContextMenu(false);
  };

  const handleReplyClick = () => {
    if (onReplyClick) {
      onReplyClick(message._id);
    }
    setShowContextMenu(false);
  };

  // Handle right-click for context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // ======================
  // MEDIA FILE FUNCTIONS
  // ======================

  const getFileIcon = () => {
    const fileType = message.fileType;
    const fileName = message.fileName;

    if (fileType === 'image') return <FaFileImage className="h-5 w-5" />;
    if (fileType === 'video') return <FaFileVideo className="h-5 w-5" />;
    if (fileType === 'audio') return <FaFileAudio className="h-5 w-5" />;

    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') return <FaFilePdf className="h-5 w-5" />;
      if (['doc', 'docx'].includes(ext || '')) return <FaFile className="h-5 w-5" />;
    }

    return <FaFile className="h-5 w-5" />;
  };

  const formatFileSize = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderMediaContent = () => {
    if (!message.fileUrl && !message.fileName) return null;

    const fileSize = (message as any).fileSize || (message as any).size;

    return (
      <div className="space-y-2">
        {/* Image preview */}
        {message.fileType === 'image' && message.fileUrl && (
          <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 max-w-full">
            <img
              src={message.fileUrl}
              alt={message.fileName || 'Image'}
              className="max-w-full h-auto max-h-[300px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.fileUrl, '_blank')}
              onError={(e) => {
                console.error('Image failed to load:', message.fileUrl);
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* File info card */}
        <div className={`flex items-start gap-3 p-3 rounded-lg ${isCurrentUser
          ? 'bg-blue-600/10 border border-blue-600/20'
          : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700'
          }`}>
          <div className={`p-2 rounded-md ${isCurrentUser
            ? 'bg-blue-600/20 text-blue-600 dark:text-blue-400'
            : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400'
            }`}>
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {message.fileName || 'File'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <span>{message.fileType?.toUpperCase() || 'FILE'}</span>
              {fileSize && (
                <>
                  <span>•</span>
                  <span>{formatFileSize(fileSize)}</span>
                </>
              )}
            </div>

            {/* Download/View button */}
            <div className="mt-2">
              <a
                href={message.fileUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${isCurrentUser
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white'
                  }`}
                onClick={(e) => e.stopPropagation()}
              >
                {message.fileType === 'image' ? 'View' : 'Download'}
                <FiDownload className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ======================
  // VOICE MESSAGE FUNCTIONS
  // ======================

  const renderVoiceMessage = () => {
    const messageAny = message as any;
    // Check multiple ways a voice message could be identified
    const isVoice = messageAny.fileType === 'audio' ||
      messageAny.type === 'voice' ||
      message.content.includes('🎙️') ||
      (messageAny.fileName && messageAny.fileName.startsWith('voice-'));

    // Debug log
    console.log('Voice check:', {
      fileType: messageAny.fileType,
      fileUrl: messageAny.fileUrl,
      fileName: messageAny.fileName,
      isVoice
    });

    if (!isVoice) return null;

    // Check for fileUrl - it might be in the message object
    const audioUrl = messageAny.fileUrl || messageAny.file?.url;
    if (!audioUrl) {
      console.log('No audio URL found for voice message');
      return null;
    }

    return (
      <div className="mt-1">
        <VoiceMessage
          audioUrl={`http://localhost:8080${audioUrl}`}
          duration={messageAny.duration || 0}
          isOwn={isCurrentUser}
        />
      </div>
    );
  };

  // Render message content with proper line breaks and spacing
  const renderMessageContent = () => {
    const lines = message.content.split('\n');

    // Check if this is a file-only message (no text content besides file indicator)
    const isFileOnlyMessage = message.fileUrl && (message.content.startsWith('📎') || !message.content.trim());

    return (
      <div className="emoji-font space-y-2">
        {/* Render media content first if exists */}
        {(message.fileUrl || message.fileName) && renderMediaContent()}

        {/* Render voice message if exists */}
        {renderVoiceMessage()}

        {/* Render text content if exists and not file-only */}
        {!isFileOnlyMessage && message.content.trim() && (
          <div>
            {lines.map((line, index) => (
              <div
                key={index}
                className="leading-normal"
                style={{
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif',
                  marginTop: index > 0 ? '2px' : '0'
                }}
              >
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Calculate if message is short (to adjust spacing)
  const isShortMessage = () => {
    return message.content.length < 20 && !message.content.includes('\n');
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setShowContextMenu(false);
      }
      if (showReactions && bubbleRef.current && !bubbleRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showReactions]);

  // Updated bubble styling for better grouping
  const getBubbleStyles = () => {
    const baseStyles = "relative px-3 py-1.5 break-words whitespace-pre-wrap max-w-full";
    const isShort = isShortMessage();

    if (isCurrentUser) {
      // Current user (right side) - Telegram blue
      let borderRadius = "";

      if (isFirstInGroup && isLastInGroup) {
        borderRadius = "rounded-2xl";
      } else if (isFirstInGroup) {
        borderRadius = "rounded-t-2xl rounded-br-lg rounded-bl-2xl";
      } else if (isLastInGroup) {
        borderRadius = "rounded-b-2xl rounded-tr-lg rounded-tl-2xl";
      } else {
        borderRadius = "rounded-l-2xl rounded-r-lg";
      }

      return `${baseStyles} ${borderRadius} bg-blue-600 text-white shadow-sm ${isShort ? 'px-3' : ''}`;
    } else {
      // Other user (left side) - Slate theme
      let borderRadius = "";

      if (isFirstInGroup && isLastInGroup) {
        borderRadius = "rounded-2xl";
      } else if (isFirstInGroup) {
        borderRadius = "rounded-t-2xl rounded-bl-lg rounded-br-2xl";
      } else if (isLastInGroup) {
        borderRadius = "rounded-b-2xl rounded-tl-lg rounded-tr-2xl";
      } else {
        borderRadius = "rounded-r-2xl rounded-l-lg";
      }

      return `${baseStyles} ${borderRadius} bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-zinc-800 ${isShort ? 'px-3' : ''}`;
    }
  };

  return (
    <div
      ref={bubbleRef}
      className={`group relative ${isCurrentUser ? 'ml-auto' : 'mr-auto'} max-w-[85%] ${!isLastInGroup ? 'mb-0' : ''}`}
      onContextMenu={handleContextMenu}
    >
      {/* Message bubble */}
      <div className={getBubbleStyles()}>
        {/* Message content */}
        <div className="relative">
          {renderMessageContent()}

          {/* Telegram-style timestamp and actions */}
          <div className={`flex items-center justify-end mt-0.5 ${isShortMessage() ? 'min-h-[15px]' : 'min-h-[18px]'}`}>
            {/* Action buttons (visible on hover) */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {onReactionSelect && (
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className={`p-0.5 rounded transition-colors ${isCurrentUser
                    ? 'hover:bg-blue-600'
                    : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  aria-label="Add reaction"
                >
                  <MdOutlineEmojiEmotions className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Time and status (always visible) */}
            <div className={`flex items-center space-x-1 ml-2 ${isCurrentUser ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
              }`}>
              {showTime && (
                <span className="text-[11px] font-medium">
                  {formatTime()}
                </span>
              )}
              {getStatusIcon()}
            </div>
          </div>
        </div>
      </div>

      {/* Reactions display - Telegram style pills */}
      {reactions.length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-0.5 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
          {reactions.map((reaction, index) => (
            <button
              key={index}
              onClick={() => handleReactionSelect(reaction.emoji)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all hover:scale-105 active:scale-95 emoji-font ${isCurrentUser
                ? 'bg-blue-600 text-white border border-blue-500'
                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 shadow-sm'
                }`}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
              }}
            >
              <span className="text-[10px]">{reaction.emoji}</span>
              {reaction.count > 1 && (
                <span className="text-[10px] font-medium">{reaction.count}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Telegram-style reaction picker (appears above message) */}
      {showReactions && onReactionSelect && (
        <div
          className="absolute -top-10 left-0 z-30 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-slate-200 dark:border-zinc-700 p-2 emoji-font"
          style={{
            transform: 'translateX(-50%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'
          }}
        >
          <div className="flex items-center gap-1">
            {['👍', '❤️', '🔥', '😮', '😢', '👏', '🎉', '🤔'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReactionSelect(emoji)}
                className="text-xl p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-transform duration-150 hover:scale-125"
                style={{ fontSize: '20px' }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Telegram-style context menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white/95 dark:bg-black/95 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 py-1 min-w-[160px] backdrop-blur-md"
          style={{
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={handleReplyClick}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
          >
            <BsReply className="h-4 w-4" />
            Reply
          </button>
          <button
            onClick={handleCopyText}
            className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors"
          >
            <FiCopy className="h-4 w-4" />
            Copy
          </button>
          {isCurrentUser && (
            <>
              <button className="w-full px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors">
                <FiEdit2 className="h-4 w-4" />
                Edit
              </button>
              <div className="border-t border-slate-200 dark:border-zinc-800 my-1"></div>
              <button className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors">
                <FiTrash2 className="h-4 w-4" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default MessageBubble;
