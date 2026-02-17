'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiLogOut, FiUser, FiMenu, FiChevronLeft, FiMessageSquare } from 'react-icons/fi';
import { Users, Home, Search, Settings } from 'lucide-react';
import { authAPI, userAPI, messageAPI } from '../../lib/api';
import { User, Message } from '../../types';
import UserList from '../components/UserList';
import ChatHeader from '../components/ChatHeader';
import MessageInput from '../components/MessageInput';
import MessageGroup from '../components/MessageGroup';
import SearchBar from '../components/SearchBar';
import NotificationBadge from '../components/NotificationBadge';
import { usePolling } from '../hooks/usePolling';
import ThemeToggle from '../components/ThemeToggle';
import { useSocketContext } from '../context/SocketContext';

import { AnimatePresence, motion } from 'framer-motion';
import ChatSkeleton from '../components/Skeletons/ChatSkeleton';

export default function ChatPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const { socket, isConnected } = useSocketContext();
  const [reactions, setReactions] = useState<Array<{
    messageId: string;
    emoji: string;
    userId: string;
  }>>([]);
  const [userTyping, setUserTyping] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // ======================
  // RESPONSIVE HANDLING
  // ======================

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(!selectedUser);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [selectedUser]);

  // Close sidebar on mobile when selecting a user
  useEffect(() => {
    if (isMobile && selectedUser) {
      setIsSidebarOpen(false);
    }
  }, [selectedUser, isMobile]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile &&
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isSidebarOpen]);

  // Handle back button and keyboard shortcuts
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && selectedUser) {
        handleBackToChats();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobile, selectedUser]);

  // ======================
  // SOCKET.IO SETUP
  // ======================

  // Socket setup for online status
  useEffect(() => {
    if (!socket || !currentUserId) return;

    // Emit user online
    socket.emit('user-online', currentUserId);

    // Listen for user status changes
    const handleUserStatusChange = (data: { userId: string; isOnline: boolean }) => {
      setUsers(prev => prev.map(user =>
        user._id === data.userId
          ? { ...user, isOnline: data.isOnline }
          : user
      ));
    };

    // Listen for incoming messages
    const handleReceiveMessage = (incomingMessage: any) => {
      console.log('📨 Real-time message received:', incomingMessage);

      // Check if this message is for the currently selected chat
      if (incomingMessage.senderId === selectedUser) {
        const newMessage: Message = {
          _id: incomingMessage._id || `socket-${Date.now()}`,
          content: incomingMessage.content || incomingMessage.message?.content,
          sender: incomingMessage.senderId,
          receiver: incomingMessage.receiverId || currentUserId,
          isRead: false,
          createdAt: incomingMessage.timestamp || incomingMessage.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          // File/Media properties
          fileUrl: incomingMessage.fileUrl,
          fileType: incomingMessage.fileType,
          fileName: incomingMessage.fileName,
          fileSize: incomingMessage.fileSize,
          duration: incomingMessage.duration
        };

        console.log('✅ Adding message to chat:', newMessage);

        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();

        // Mark as read immediately if we're viewing the chat
        if (selectedUser === incomingMessage.senderId) {
          markMessageAsRead(incomingMessage._id);
        }
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === selectedUser) {
        setUserTyping(data.isTyping ? selectedUser : null);
      }
    };

    // Listen for message read receipts
    const handleMessageRead = (data: { messageId: string; readerId: string }) => {
      if (data.readerId === selectedUser) {
        setMessages(prev => prev.map(msg =>
          msg._id === data.messageId ? { ...msg, isRead: true } : msg
        ));
      }
    };

    socket.on('user-status-change', handleUserStatusChange);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('message-read', handleMessageRead);

    // Reconnect handler
    const handleReconnect = () => {
      socket.emit('user-online', currentUserId);
      // Re-fetch messages for current chat
      if (selectedUser) {
        fetchMessages(selectedUser);
      }
    };

    socket.on('connect', handleReconnect);

    // Cleanup
    return () => {
      socket.off('user-status-change', handleUserStatusChange);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('message-read', handleMessageRead);
      socket.off('connect', handleReconnect);
    };
  }, [socket, currentUserId, selectedUser]);

  // ======================
  // DATA FETCHING
  // ======================

  const fetchUsers = useCallback(async () => {
    try {
      const response = await userAPI.getAll();
      let usersArray: any[] = [];

      if (response.data && response.data.data && response.data.data.all) {
        usersArray = response.data.data.all;
      } else if (Array.isArray(response.data)) {
        usersArray = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        usersArray = response.data.data;
      } else {
        usersArray = [];
      }

      // Map users and ensure isOnline property exists with default value
      const mappedUsers = usersArray.map(user => ({
        ...user,
        isOnline: user.isOnline !== undefined ? user.isOnline : false // Default to false if not provided
      }));

      console.log('📊 Fetched users with online status:', mappedUsers.map(u => ({ name: u.name, isOnline: u.isOnline })));
      setUsers(mappedUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  }, []);

  const getSenderId = useCallback((sender: any): string => {
    if (!sender) return currentUserId || '';
    if (typeof sender === 'string') return sender;
    if (typeof sender === 'object') {
      if (sender._id) return sender._id;
      if (sender.id) return sender.id;
    }
    return currentUserId || '';
  }, [currentUserId]);

  const fetchMessages = useCallback(async (userId: string) => {
    setMessagesLoading(true);
    try {
      const response = await messageAPI.getChat(userId);
      let messagesArray: any[] = [];

      if (response.data && Array.isArray(response.data)) {
        messagesArray = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        messagesArray = response.data.data;
      } else if (response.data?.messages && Array.isArray(response.data.messages)) {
        messagesArray = response.data.messages;
      } else {
        setMessages([]);
        return;
      }

      const filteredMessages = messagesArray.filter((msg: any) => {
        const senderId = getSenderId(msg.sender);
        let receiverId = msg.receiver;
        if (msg.receiver && typeof msg.receiver === 'object' && msg.receiver._id) {
          receiverId = msg.receiver._id;
        }
        return (senderId === currentUserId && receiverId === userId) ||
          (senderId === userId && receiverId === currentUserId);
      });

      const convertedMessages: Message[] = filteredMessages.map((msg: any) => {
        const senderId = getSenderId(msg.sender);

        let normalizedReceiver = msg.receiver;
        if (msg.receiver && typeof msg.receiver === 'object') {
          if (msg.receiver._id) {
            normalizedReceiver = msg.receiver._id;
          } else {
            normalizedReceiver = userId;
          }
        }

        if (normalizedReceiver && typeof normalizedReceiver !== 'string') {
          normalizedReceiver = String(normalizedReceiver);
        }

        return {
          _id: msg._id || msg.id,
          content: msg.content || '',
          sender: senderId,
          receiver: normalizedReceiver || userId,
          isRead: msg.isRead || false,
          createdAt: msg.createdAt || new Date().toISOString(),
          updatedAt: msg.updatedAt || new Date().toISOString()
        };
      });

      const sortedMessages = convertedMessages.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setMessages(sortedMessages);

    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, [currentUserId, getSenderId]);

  // ======================
  // POLLING (for inactive chats only)
  // ======================

  // Poll users every 60 seconds (reduced polling for better performance)
  usePolling(() => {
    fetchUsers();
  }, 60000);

  // Poll messages only if NOT connected via socket (fallback)
  usePolling(() => {
    if (selectedUser && !isConnected) {
      console.log('⚠️ Using polling fallback for messages');
      fetchMessages(selectedUser);
    }
  }, 15000); // 15 seconds as fallback (reduced frequency)

  // ======================
  // UI HELPERS
  // ======================

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }, 100);
  };

  // ======================
  // AUTH & INIT
  // ======================

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.getProfile();

        let userId = '';

        if (response.data) {
          if (response.data.user && response.data.user._id) {
            userId = response.data.user._id;
          } else if (response.data._id) {
            userId = response.data._id;
          } else if (response.data.id) {
            userId = response.data.id;
          } else if (response.data.data && response.data.data._id) {
            userId = response.data.data._id;
          } else if (response.data.userId) {
            userId = response.data.userId;
          } else if (response.data.user && response.data.user.id) {
            userId = response.data.user.id;
          }
        }

        if (userId) {
          setCurrentUserId(userId);
        } else {
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              if (payload.userId || payload._id || payload.id) {
                const jwtUserId = payload.userId || payload._id || payload.id;
                setCurrentUserId(jwtUserId);
              }
            } catch (jwtErr) {
              console.error('Failed to decode JWT:', jwtErr);
            }
          }
        }

        await fetchUsers();
        setLoading(false);
      } catch (err: any) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        router.push('/login');
      }
    };

    checkAuth();
  }, [fetchUsers, router]);

  // ======================
  // MESSAGE HANDLING
  // ======================

  const handleTypingChange = (text: string) => {
    setMessage(text);

    if (!socket || !selectedUser || !currentUserId) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Emit typing start
    socket.emit('typing', {
      receiverId: selectedUser,
      isTyping: true,
      senderId: currentUserId
    });

    // Emit typing stop after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        receiverId: selectedUser,
        isTyping: false,
        senderId: currentUserId
      });
    }, 1000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !selectedUser || !currentUserId || !socket) {
      return;
    }

    const messageToSend = message.trim();
    const targetUser = selectedUser;

    try {
      // 1. Optimistic UI update
      const tempMessage: Message = {
        _id: `temp-${Date.now()}`,
        content: messageToSend,
        sender: currentUserId,
        receiver: targetUser,
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setMessages(prev => [...prev, tempMessage]);
      setMessage('');
      scrollToBottom();

      // 2. Send via WebSocket for real-time delivery
      socket.emit('send-message', {
        receiverId: targetUser,
        message: {
          content: messageToSend,
          createdAt: new Date().toISOString()
        },
        senderId: currentUserId
      });

      console.log('📤 Message sent via WebSocket to:', targetUser);

      // 3. Also send via REST API for database persistence
      try {
        await messageAPI.send({
          receiverId: targetUser,
          content: messageToSend
        });
        console.log('💾 Message saved to database');
      } catch (dbError) {
        console.error('Failed to save message to DB:', dbError);
        // Message still delivered via socket, will be saved when receiver is offline
      }

      // 4. Stop typing indicator
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.emit('typing', {
        receiverId: targetUser,
        isTyping: false,
        senderId: currentUserId
      });

      // 5. Refresh messages to get the real ID from DB (optional, keeps UI in sync)
      setTimeout(() => {
        fetchMessages(targetUser);
      }, 500);

    } catch (err: any) {
      console.error('Failed to send message:', err);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    if (!socket || !selectedUser || !currentUserId) return;

    try {
      // Update UI immediately
      setMessages(prev => prev.map(msg =>
        msg._id === messageId ? { ...msg, isRead: true } : msg
      ));

      // Notify sender via socket
      socket.emit('message-read', {
        messageId,
        readerId: currentUserId,
        senderId: selectedUser
      });

      // Also update in database
      await messageAPI.markAsRead(messageId);

    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  // ======================
  // REACTIONS
  // ======================

  const handleReactionSelect = useCallback((messageId: string, reaction: string) => {
    if (!currentUserId) {
      console.error('❌ Cannot add reaction: currentUserId is empty!');
      return;
    }

    if (reaction.length > 2 || reaction.includes('message') || /^[0-9a-f]{24}$/i.test(reaction)) {
      console.error('❌ Invalid reaction value:', reaction, 'Expected emoji, got message ID?');
      return;
    }

    const existingReaction = reactions.find(
      r => r.messageId === messageId && r.userId === currentUserId && r.emoji === reaction
    );

    if (existingReaction) {
      setReactions(prev => prev.filter(r =>
        !(r.messageId === messageId && r.userId === currentUserId && r.emoji === reaction)
      ));
    } else {
      setReactions(prev => [...prev, {
        messageId,
        emoji: reaction,
        userId: currentUserId
      }]);
    }
  }, [currentUserId, reactions]);

  const getMessageReactions = useCallback((messageId: string) => {
    const messageReactions = reactions.filter(r => r.messageId === messageId);

    const grouped = messageReactions.reduce((acc, reaction) => {
      const existing = acc.find(item => item.emoji === reaction.emoji);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ emoji: reaction.emoji, count: 1 });
      }
      return acc;
    }, [] as Array<{ emoji: string; count: number }>);

    return grouped;
  }, [reactions]);

  // ======================
  // UTILITIES
  // ======================

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleBackToChats = () => {
    setSelectedUser(null);
    if (isMobile) {
      setIsSidebarOpen(true);
    }
  };

  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach(msg => {
      const date = new Date(msg.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });

    return Object.entries(groups).map(([date, msgs]) => ({
      date,
      messages: msgs
    }));
  };

  // Memoize filtered users to prevent unnecessary re-filtering
  const filteredUsers = useMemo(() =>
    users.filter(user =>
      (user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      user._id !== currentUserId
    ),
    [users, searchQuery, currentUserId]
  );

  // ======================
  // RENDER
  // ======================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-500 dark:border-blue-400 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading QuickChat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
      {/* Top Header */}
      <header className="bg-white/80 dark:bg-black/95 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          {/* Mobile Menu Button */}
          {isMobile && selectedUser ? (
            <button
              onClick={handleBackToChats}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Back to chats"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
          ) : isMobile ? (
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <FiMessageSquare className="h-5 w-5 text-white" />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
              <FiUser className="h-5 w-5 text-white" />
            </div>
          )}

          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 dark:text-white text-base tracking-tight truncate">
              {isMobile && selectedUser
                ? users.find(u => u._id === selectedUser)?.name || 'Chat'
                : 'QuickChat'
              }
            </h1>
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {/* MOBILE NAVIGATION BUTTONS - ALWAYS VISIBLE */}
          {isMobile && !selectedUser && (
            <>
              <button
                onClick={() => router.push('/')}
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                title="Home"
              >
                <Home className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push('/friends')}
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                title="Friends"
              >
                <Users className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
            </>
          )}

          {/* DESKTOP NAVIGATION */}
          {!isMobile && (
            <>
              <Link
                href="/"
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 hidden sm:block transition-colors"
                title="Home"
              >
                <Home className="h-5 w-5" />
              </Link>
              <Link
                href="/friends"
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                title="Friends"
              >
                <Users className="h-5 w-5" />
              </Link>
              <Link
                href="/settings"
                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
                title="Settings"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <div className="h-6 w-px bg-slate-200 dark:bg-zinc-900 mx-1"></div>
              <NotificationBadge />
              <ThemeToggle />
            </>
          )}

          {/* Mobile Menu Toggle - Only show when sidebar can be toggled */}
          {isMobile && !selectedUser && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
              title="Toggle sidebar"
            >
              {isSidebarOpen ? <Search className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
            </button>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors ml-1"
            title="Logout"
          >
            <FiLogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - User List */}
        {(isSidebarOpen || !isMobile) && (
          <div
            ref={sidebarRef}
            className={`${isMobile ? 'absolute inset-0 z-40 bg-white dark:bg-black' : 'w-full md:w-80 lg:w-96'} border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-black flex flex-col transition-all duration-300 shadow-sm`}
          >
            {/* Mobile Tabs - Only show on mobile when sidebar is open */}
            {isMobile && (
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setActiveTab('chats')}
                  className={`flex-1 py-3 text-center font-medium text-sm ${activeTab === 'chats'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <FiMessageSquare className="h-4 w-4" />
                    <span>Chats</span>
                  </div>
                </button>
                <button
                  onClick={() => router.push('/friends')}
                  className="flex-1 py-3 text-center font-medium text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Friends</span>
                  </div>
                </button>
              </div>
            )}

            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <SearchBar onSearch={setSearchQuery} />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <UserList
                users={filteredUsers}
                currentUserId={currentUserId}
                selectedUser={selectedUser}
                onSelectUser={(userId) => {
                  setSelectedUser(userId);
                  setUserTyping(null);
                  fetchMessages(userId);

                  setTimeout(() => {
                    messages.forEach(msg => {
                      if (msg.sender === userId && !msg.isRead) {
                        markMessageAsRead(msg._id);
                      }
                    });
                  }, 500);
                }}
              />
            </div>

            {/* Mobile Bottom Navigation - When sidebar is closed */}
            {isMobile && !isSidebarOpen && (
              <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-black p-2 safe-area-bottom">
                <div className="flex justify-around">
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="flex flex-col items-center p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <FiMessageSquare className="h-5 w-5" />
                    <span className="text-[10px] font-medium mt-1">Chats</span>
                  </button>
                  <button
                    onClick={() => router.push('/friends')}
                    className="flex flex-col items-center p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Users className="h-5 w-5" />
                    <span className="text-[10px] font-medium mt-1">Friends</span>
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="flex flex-col items-center p-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Home className="h-5 w-5" />
                    <span className="text-[10px] font-medium mt-1">Home</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-black ${isMobile && !selectedUser ? 'hidden' : 'block'}`}>
          {selectedUser ? (
            <>
              {/* Chat Header (Mobile shows minimal header) */}
              {!isMobile && (
                <ChatHeader
                  userName={users.find(u => u._id === selectedUser)?.name || 'User'}
                  isOnline={users.find(u => u._id === selectedUser)?.isOnline || false}
                />
              )}

              {/* Typing Indicator */}
              {userTyping === selectedUser && (
                <div className="px-3 py-2 bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="h-1.5 w-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="h-1.5 w-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="h-1.5 w-1.5 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      is typing...
                    </span>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-black custom-scrollbar">
                <div className="px-2 sm:px-4 py-4 max-w-5xl mx-auto min-h-full flex flex-col justify-end">
                  {messagesLoading ? (
                    <ChatSkeleton />
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {groupMessagesByDate().map((group) => (
                        <motion.div
                          key={group.date}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3 }}
                          layout
                        >
                          <MessageGroup
                            date={group.date}
                            messages={group.messages}
                            currentUserId={currentUserId}
                            users={users}
                            getSenderId={getSenderId}
                            onReactionSelect={handleReactionSelect}
                            getMessageReactions={getMessageReactions}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                  <div ref={messagesEndRef} className="h-2" />
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 dark:border-zinc-800">
                <MessageInput
                  value={message}
                  onChange={handleTypingChange}
                  onSend={() => {
                    if (message.trim() && selectedUser && currentUserId) {
                      const syntheticEvent = { preventDefault: () => { } } as React.FormEvent;
                      handleSendMessage(syntheticEvent);
                    }
                  }}
                  disabled={!currentUserId || !selectedUser}
                  receiverId={selectedUser}
                  currentUserId={currentUserId}
                />
              </div>
            </>
          ) : (
            /* Empty State - No chat selected */
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-black p-4 sm:p-8">
              <div className="text-center max-w-md">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4">
                  <FiMessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400 dark:text-gray-500" />
                </div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2">
                  {isMobile ? 'Select a chat' : 'Welcome to QuickChat'}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 px-4">
                  {users.length > 0
                    ? isMobile
                      ? 'Tap on a conversation to start chatting.'
                      : 'Select a conversation to start chatting.'
                    : 'No users available.'
                  }
                </p>
                {!isConnected && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg mx-4">
                    <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300">
                      ⚠️ Using polling mode. Connect to WebSocket for real-time messaging.
                    </p>
                  </div>
                )}
                {isMobile && !isSidebarOpen && (
                  <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
                  >
                    Open Chats
                  </button>
                )}
                {!isMobile && (
                  <div className="mt-6 grid grid-cols-2 gap-3 px-4">
                    <Link
                      href="/friends"
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm text-center"
                    >
                      Find Friends
                    </Link>
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className="px-4 py-2.5 bg-gray-200 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors text-sm"
                    >
                      {isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation - Always visible when not in chat */}
      {isMobile && !selectedUser && !isSidebarOpen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-zinc-800 p-2 z-50">
          <div className="flex justify-around">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <FiMessageSquare className="h-5 w-5" />
              <span className="text-xs mt-1">Chats</span>
            </button>
            <button
              onClick={() => router.push('/friends')}
              className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs mt-1">Friends</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Home className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
            >
              <FiLogOut className="h-5 w-5" />
              <span className="text-xs mt-1">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
