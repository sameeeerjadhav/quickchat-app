'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocketContext } from '../context/SocketContext';
import { FiPaperclip, FiMic, FiImage, FiSmile, FiSend, FiX, FiFile, FiVideo, FiMusic } from 'react-icons/fi';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  receiverId?: string;
  currentUserId?: string;
  onFileSelect?: (file: File) => void;
  onMessageSent?: () => void;
}

export default function MessageInput({ 
  value, 
  onChange, 
  onSend, 
  disabled = false,
  receiverId,
  currentUserId,
  onFileSelect,
  onMessageSent 
}: MessageInputProps) {
  const { socket } = useSocketContext();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  // Responsive emoji picker position
  const [emojiPickerPosition, setEmojiPickerPosition] = useState<'top' | 'bottom'>('top');

  useEffect(() => {
    const checkViewport = () => {
      if (window.innerHeight < 600) {
        setEmojiPickerPosition('bottom');
      } else {
        setEmojiPickerPosition('top');
      }
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Join user room on mount
  useEffect(() => {
    if (socket && currentUserId) {
      socket.emit('join-user-room', currentUserId);
      console.log('🚪 Joined user room:', currentUserId);
    }
  }, [socket, currentUserId]);

  const handleTyping = (isTyping: boolean) => {
    if (!receiverId || !currentUserId || !socket) {
      console.log('❌ Cannot emit typing - missing data:', {
        receiverId,
        currentUserId,
        socket: !!socket
      });
      return;
    }
    
    socket.emit('typing', { receiverId, isTyping });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.trim() && !typingTimeoutRef.current) {
      handleTyping(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      if (newValue.trim()) {
        handleTyping(false);
      }
      typingTimeoutRef.current = null;
    }, 1000);
  };

  // ======================
  // MEDIA UPLOAD FUNCTIONS
  // ======================

  const uploadFile = async (file: File, fileType: 'image' | 'video' | 'audio' | 'file') => {
    if (!receiverId || !currentUserId || !socket) {
      console.error('Cannot upload file: Missing required data');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setSelectedFileName(file.name);

    // Determine file type from MIME type
    let detectedFileType = fileType;
    if (!detectedFileType) {
      if (file.type.startsWith('image/')) {
        detectedFileType = 'image';
      } else if (file.type.startsWith('video/')) {
        detectedFileType = 'video';
      } else if (file.type.startsWith('audio/')) {
        detectedFileType = 'audio';
      } else {
        detectedFileType = 'file';
      }
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('receiverId', receiverId);
      formData.append('senderId', currentUserId);
      formData.append('fileType', detectedFileType);
      
      if (value.trim()) {
        formData.append('text', value);
        onChange(''); // Clear input
      }

      // Create optimistic message for immediate UI update
      const tempMessage = {
        _id: `temp-file-${Date.now()}`,
        sender: currentUserId,
        receiver: receiverId,
        content: value.trim() || `📎 Uploading ${file.name}...`,
        fileUrl: '',  // Will be updated when backend responds
        fileType: detectedFileType,
        fileName: file.name,
        fileSize: file.size,
        isRead: true,  // Read by sender
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Emit optimistic message via socket to yourself immediately
      socket.emit('send-file-message', {
        receiverId,
        senderId: currentUserId,
        message: tempMessage
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Send file to backend
      const token = localStorage.getItem('token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/api/messages/send-file`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setSelectedFileName(null);
        setUploadProgress(0);
        
        if (onMessageSent) {
          onMessageSent();
        }
        
        console.log('✅ File uploaded successfully:', data);
      }, 500);

    } catch (error) {
      console.error('File upload failed:', error);
      setIsUploading(false);
      setSelectedFileName(null);
      setUploadProgress(0);
      
      // Show error to user
      alert(`Failed to upload file: ${error.message || 'Unknown error'}`);
    }
  };

  const handleFileSelect = (file: File, type: 'image' | 'video' | 'audio' | 'file') => {
    if (onFileSelect) {
      onFileSelect(file);
    }
    
    uploadFile(file, type);
    setShowMediaMenu(false);
  };

  const handleFileClick = (fileType: 'all' | 'image' | 'video' | 'audio' = 'all') => {
    setShowMediaMenu(false);
    if (fileType === 'image') {
      imageInputRef.current?.click();
    } else if (fileType === 'video') {
      videoInputRef.current?.click();
    } else if (fileType === 'audio') {
      audioInputRef.current?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio' | 'file') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file, type);
    }
    e.target.value = '';
  };

  // ======================
  // VOICE MESSAGE RECORDING
  // ======================

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
    
    console.log('🎤 Starting voice recording...');
  };

  const stopRecording = () => {
    setIsRecording(false);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (recordingTime > 1) {
      console.log(`🎤 Recording stopped after ${recordingTime} seconds`);
      if (receiverId && currentUserId && socket) {
        socket.emit('send-message', {
          receiverId,
          message: {
            content: '🎤 Voice message',
            voice: {
              duration: recordingTime,
              url: `#voice-${Date.now()}.mp3`
            }
          },
          senderId: currentUserId
        });
      }
    }
    
    setRecordingTime(0);
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      handleTyping(false);
      onSend();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      if (onMessageSent) {
        onMessageSent();
      }
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    if (emoji.native) {
      onChange(value + emoji.native);
    }
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (!(e.target as HTMLElement).closest('.media-menu')) {
        setShowMediaMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (receiverId && currentUserId && socket) {
        socket.emit('typing', { receiverId, isTyping: false });
      }
    };
  }, [receiverId, currentUserId, socket]);

  return (
    <div className="relative">
      {/* Emoji Picker - Responsive positioning */}
      {showEmojiPicker && (
        <div 
          ref={emojiPickerRef}
          className={`absolute z-50 shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${
            emojiPickerPosition === 'top' 
              ? 'bottom-full right-0 mb-2 max-h-[350px] overflow-y-auto' 
              : 'top-full right-0 mt-2 max-h-[300px] overflow-y-auto'
          }`}
        >
          <div className="bg-white dark:bg-gray-800 p-2">
            <div className="flex justify-between items-center mb-2 px-2 sticky top-0 bg-white dark:bg-gray-800 z-10 py-1">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Emoji</h3>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-target"
                aria-label="Close emoji picker"
              >
                <FiX className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="light"
                previewPosition="none"
                skinTonePosition="none"
                perLine={8}
                emojiSize={24}
                maxFrequentRows={1}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileChange(e, 'file')}
        className="hidden"
        accept="*/*"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleFileChange(e, 'image')}
        className="hidden"
        accept="image/*"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={(e) => handleFileChange(e, 'video')}
        className="hidden"
        accept="video/*"
      />
      <input
        type="file"
        ref={audioInputRef}
        onChange={(e) => handleFileChange(e, 'audio')}
        className="hidden"
        accept="audio/*"
      />
      
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 px-3 sm:px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        {isUploading && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <FiFile className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate text-xs sm:text-sm">
                  {selectedFileName}
                </span>
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 flex-shrink-0 ml-2">
                {uploadProgress}%
              </span>
            </div>
            <div className="h-1.5 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Media Attachment Button - Mobile friendly */}
          <div className="relative media-menu">
            <button
              type="button"
              onClick={() => setShowMediaMenu(!showMediaMenu)}
              disabled={disabled || isUploading}
              className="p-2 sm:p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50 touch-target"
              aria-label="Attach file"
            >
              <FiPaperclip className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            {/* Media Menu - Responsive positioning */}
            {showMediaMenu && (
              <div className={`absolute ${
                emojiPickerPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
              } left-0 z-40 min-w-[160px] sm:min-w-[180px]`}>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1">
                  <button
                    type="button"
                    onClick={() => handleFileClick('image')}
                    className="w-full px-3 sm:px-4 py-2.5 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 sm:gap-3 touch-target"
                  >
                    <FiImage className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Photo & Video</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFileClick('all')}
                    className="w-full px-3 sm:px-4 py-2.5 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 sm:gap-3 touch-target"
                  >
                    <FiFile className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFileClick('audio')}
                    className="w-full px-3 sm:px-4 py-2.5 text-left text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 sm:gap-3 touch-target"
                  >
                    <FiMusic className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Audio File</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Message Input Field */}
          <div className="flex-1 relative min-w-0">
            <input
              type="text"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              disabled={disabled || isUploading}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pl-4 pr-10 sm:pr-12 bg-gray-100 dark:bg-gray-800 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 text-sm sm:text-[15px] touch-target"
              autoFocus
            />
            
            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled || isUploading}
              className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-full transition-colors touch-target"
              aria-label="Select emoji"
            >
              <FiSmile className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          
          {/* Send/Record Button */}
          {value.trim() ? (
            <button
              type="submit"
              disabled={!value.trim() || disabled || isUploading}
              className="p-2.5 sm:p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 touch-target"
              aria-label="Send message"
            >
              <FiSend className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRecordingToggle}
              disabled={disabled || isUploading}
              className={`p-2.5 sm:p-3 rounded-full transition-all duration-200 touch-target ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              <FiMic className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>
        
        {/* Recording Indicator */}
        {isRecording && (
          <div className="mt-2 px-3 sm:px-4 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500 animate-pulse flex-shrink-0"></div>
              <span className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium truncate">
                Recording... {formatTime(recordingTime)}
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="text-xs sm:text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium flex-shrink-0 ml-2 touch-target"
            >
              Send
            </button>
          </div>
        )}
        
        {/* Keyboard Shortcuts Help */}
        <div className="flex items-center justify-between mt-2 px-1 flex-wrap gap-1">
          <div className="flex items-center gap-1">
            <span className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400">
              Press Enter to send • Shift+Enter for new line
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="text-[10px] xs:text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 px-1.5 sm:px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 touch-target"
              onClick={() => onChange(value + ' **bold** ')}
            >
              Bold
            </button>
            <button
              type="button"
              className="text-[10px] xs:text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 px-1.5 sm:px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 touch-target"
              onClick={() => onChange(value + ' *italic* ')}
            >
              Italic
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}