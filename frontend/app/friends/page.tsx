'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, Bell, UserPlus, UserX, Check, X, RefreshCw, ChevronLeft, Menu } from 'lucide-react';
import { authAPI, friendAPI, userAPI } from '../../lib/api';
import { FriendRequest, Friend } from '../../types';
import FriendList from '../components/FriendList';
import FriendRequests from '../components/FriendRequests';
import UserSearch from '../components/UserSearch';
import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';
import { useSocket } from '../hooks/useSocket';
import FriendSkeleton from '../components/Skeletons/FriendSkeleton';
import { motion, AnimatePresence } from 'framer-motion';

export default function FriendsPage() {
  const router = useRouter();
  const { socket } = useSocket();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search' | 'blocked'>('friends');
  const [currentUserId, setCurrentUserId] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  // Socket event listeners for auto-refresh
  useEffect(() => {
    if (!socket) return;

    const handleRefresh = () => {
      console.log('🔄 Socket event received, refreshing data...');
      refreshAllData();
    };

    socket.on('friend-request-received', handleRefresh);
    socket.on('friend-request-accepted', handleRefresh);
    socket.on('friend-status-updated', handleRefresh);
    socket.on('user-status-change', handleRefresh); // Update online status in lists

    return () => {
      socket.off('friend-request-received', handleRefresh);
      socket.off('friend-request-accepted', handleRefresh);
      socket.off('friend-status-updated', handleRefresh);
      socket.off('user-status-change', handleRefresh);
    };
  }, [socket]);

  const checkAuth = async () => {
    try {
      const response = await authAPI.getProfile();

      let userId = '';

      if (response.data) {
        const data = response.data;

        // Find user ID in response
        if (data.user?._id) userId = data.user._id;
        else if (data._id) userId = data._id;
        else if (data.id) userId = data.id;
        else if (data.data?._id) userId = data.data._id;
      }

      setCurrentUserId(userId);

      if (userId) {
        await refreshAllData();
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
      } else {
        setLoading(false);
      }
    }
  };

  const refreshAllData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchFriends(),
        fetchRequests(),
        fetchAllUsers(),
        fetchBlockedUsers()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await friendAPI.getFriends();
      let friendsData: Friend[] = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          friendsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          friendsData = response.data.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          friendsData = response.data.data;
        } else if (response.data.friends && Array.isArray(response.data.friends)) {
          friendsData = response.data.friends;
        }
      }

      setFriends(friendsData);
      return friendsData;
    } catch (err) {
      console.error('Failed to fetch friends:', err);
      setFriends([]);
      return [];
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await friendAPI.getRequests();
      let requestsData: FriendRequest[] = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          requestsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          requestsData = response.data.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          requestsData = response.data.data;
        }
      }

      setRequests(requestsData);
      return requestsData;
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setRequests([]);
      return [];
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await userAPI.getAll();
      let usersData: any[] = [];

      if (response.data) {
        const data = response.data;

        if (data.data) {
          const apiData = data.data;
          if (apiData.all && Array.isArray(apiData.all)) {
            usersData = apiData.all;
          } else if (apiData.users && Array.isArray(apiData.users)) {
            usersData = apiData.users;
          } else if ((apiData.friends || apiData.otherUsers)) {
            const friendsList = apiData.friends || [];
            const otherUsersList = apiData.otherUsers || [];
            usersData = [...friendsList, ...otherUsersList];
          } else if (Array.isArray(apiData)) {
            usersData = apiData;
          }
        } else if (Array.isArray(data)) {
          usersData = data;
        } else if (data.success && Array.isArray(data.data)) {
          usersData = data.data;
        }
      }

      if (currentUserId) {
        usersData = usersData.filter(user => user._id !== currentUserId);
      }

      setAllUsers(usersData);
      return usersData;
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setAllUsers([]);
      return [];
    }
  };

  const fetchBlockedUsers = async () => {
    try {
      const response = await friendAPI.getBlockedUsers();
      let blockedData: string[] = [];

      if (response.data) {
        let blockedList: any[] = [];

        if (Array.isArray(response.data)) {
          blockedList = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          blockedList = response.data.data;
        } else if (response.data.success && Array.isArray(response.data.data)) {
          blockedList = response.data.data;
        }

        blockedData = blockedList
          .map((block: any) => block.user?._id || block.user || block._id || block.id)
          .filter(Boolean);
      }

      setBlockedUsers(blockedData);
      return blockedData;
    } catch (err) {
      console.error('Failed to fetch blocked users:', err);
      setBlockedUsers([]);
      return [];
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await friendAPI.sendRequest(userId);
      showNotification('success', 'Friend request sent!');
      await fetchRequests();
      await fetchAllUsers();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleCancelRequest = async (userId: string) => {
    try {
      await friendAPI.cancelRequest(userId);
      showNotification('success', 'Request cancelled!');
      await fetchRequests();
      await fetchAllUsers();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendAPI.acceptRequest(requestId);
      showNotification('success', 'Friend request accepted!');
      await refreshAllData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendAPI.rejectRequest(requestId);
      showNotification('success', 'Friend request rejected!');
      await fetchRequests();
      await fetchAllUsers();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await friendAPI.removeFriend(friendId);
      showNotification('success', 'Friend removed!');
      await fetchFriends();
      await fetchAllUsers();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to remove friend');
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await friendAPI.blockUser(userId);
      showNotification('success', 'User blocked!');
      await refreshAllData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await friendAPI.unblockUser(userId);
      showNotification('success', 'User unblocked!');
      await refreshAllData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to unblock user');
    }
  };

  const handleSelectFriend = (friendId: string) => {
    router.push(`/chat?user=${friendId}`);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const getPendingRequestUserIds = () => {
    return requests.map(req => {
      const from = req.from as any;
      return from?._id || from?.id || from || '';
    }).filter(id => id && id !== '');
  };

  const getFriendUserIds = () => {
    return friends.map(friend => {
      const f = friend as any;
      return f.user?._id || f.user?.id || f._id || f.id || '';
    }).filter(id => id && id !== '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black">
        {/* Header Skeleton */}
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-zinc-900 animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-slate-200 dark:bg-zinc-900 rounded animate-pulse"></div>
              <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-900 rounded animate-pulse"></div>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Tabs Skeleton */}
          <div className="h-12 bg-slate-200 dark:bg-zinc-900 rounded-xl animate-pulse"></div>

          {/* Content Skeleton */}
          <div className="bg-white dark:bg-black rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <FriendSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-zinc-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm transition-all duration-300">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {isMobile && (
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          <div className={`${isMobile ? 'h-9 w-9' : 'h-11 w-11'} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20`}>
            <Users className={isMobile ? "h-4 w-4 text-white" : "h-5 w-5 text-white"} />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate">Friends</h1>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-slate-500 font-medium truncate`}>
              {friends.length} users connected
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {!isMobile && (
            <>
              <Link
                href="/chat"
                className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium transition-colors"
              >
                ← Back to Chat
              </Link>

              <button
                onClick={refreshAllData}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${refreshing
                  ? 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:shadow-sm active:scale-95'
                  }`}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </>
          )}

          {isMobile && (
            <button
              onClick={refreshAllData}
              disabled={refreshing}
              className={`p-2.5 rounded-xl transition-all duration-200 ${refreshing
                ? 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-slate-400'
                : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Tabs Menu */}
      {isMobile && showMobileMenu && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-72 bg-white dark:bg-black shadow-2xl animate-slide-in p-4 border-l border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Menu</h3>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2">
              <Link
                href="/chat"
                className="flex items-center gap-3 px-4 py-3.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                <ChevronLeft className="h-5 w-5" />
                Back to Chat
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center max-w-sm animate-fade-in border ${notification.type === 'success'
          ? 'bg-white dark:bg-zinc-900 border-green-500/20 text-green-600 dark:text-green-400'
          : 'bg-white dark:bg-zinc-900 border-red-500/20 text-red-600 dark:text-red-400'
          }`}>
          {notification.type === 'success' ? (
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-3 flex-shrink-0">
              <Check className="h-4 w-4" />
            </div>
          ) : (
            <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-3 flex-shrink-0">
              <X className="h-4 w-4" />
            </div>
          )}
          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
            {notification.message}
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Tabs */}
        <div className="bg-white dark:bg-black rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 p-1.5 mb-6 sm:mb-8 overflow-x-auto flex space-x-1">
          {[
            { id: 'friends', icon: UserCheck, label: 'Friends', count: friends.length },
            { id: 'requests', icon: Bell, label: 'Requests', count: requests.length },
            { id: 'search', icon: UserPlus, label: 'Add Friend', count: null },
            { id: 'blocked', icon: UserX, label: 'Blocked', count: blockedUsers.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-lg flex-1 sm:flex-none transition-all duration-200 ${activeTab === tab.id
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
            >
              <tab.icon className={`${isMobile ? 'h-4 w-4 mr-1.5' : 'h-4 w-4 mr-2'}`} />
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md font-semibold ${activeTab === tab.id
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                  : 'bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-slate-400'
                  }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-black rounded-2xl shadow-sm border border-slate-200 dark:border-zinc-800 p-4 sm:p-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'friends' && (
              <motion.div
                key="friends"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    My Friends
                    <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full">
                      {friends.length}
                    </span>
                  </h2>
                  {!isMobile && (
                    <button
                      onClick={fetchFriends}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Refresh List"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {friends.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-zinc-900 flex items-center justify-center mb-6 ring-1 ring-slate-100 dark:ring-slate-700">
                      <UserCheck className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      No friends yet
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
                      Your friend list is empty. Start connecting with people to chat!
                    </p>
                    <button
                      onClick={() => setActiveTab('search')}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                    >
                      <UserPlus className="h-5 w-5" />
                      Find Friends
                    </button>
                  </div>
                ) : (
                  <FriendList
                    friends={friends}
                    currentUserId={currentUserId}
                    onSelectFriend={handleSelectFriend}
                    onRemoveFriend={handleRemoveFriend}
                    isMobile={isMobile}
                  />
                )}
              </motion.div>
            )}

            {activeTab === 'requests' && (
              <motion.div
                key="requests"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Friend Requests
                    {requests.length > 0 && (
                      <span className="text-sm font-medium text-white bg-blue-600 px-2 py-0.5 rounded-full">
                        {requests.length} New
                      </span>
                    )}
                  </h2>
                  {!isMobile && (
                    <button
                      onClick={fetchRequests}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {requests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-zinc-900 flex items-center justify-center mb-6 ring-1 ring-slate-100 dark:ring-slate-700">
                      <Bell className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      No pending requests
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      You're all caught up! When you receive a friend request, it will appear here.
                    </p>
                  </div>
                ) : (
                  <FriendRequests
                    requests={requests}
                    onAcceptRequest={handleAcceptRequest}
                    onRejectRequest={handleRejectRequest}
                    isMobile={isMobile}
                  />
                )}
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Add Friends
                  </h2>
                  <div className="flex items-center gap-2">
                    {!isMobile && (
                      <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-zinc-900 px-3 py-1 rounded-full">
                        {allUsers.length} users
                      </span>
                    )}
                    <button
                      onClick={fetchAllUsers}
                      className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {allUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-zinc-900 flex items-center justify-center mb-6 ring-1 ring-slate-100 dark:ring-slate-700">
                      <UserPlus className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      No users found
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
                      We couldn't find any other users to add.
                    </p>
                    <button
                      onClick={refreshAllData}
                      className="px-6 py-2.5 bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg font-medium transition-colors"
                    >
                      Refresh List
                    </button>
                  </div>
                ) : (
                  <UserSearch
                    users={allUsers}
                    currentUserId={currentUserId}
                    onSendRequest={handleSendRequest}
                    onCancelRequest={handleCancelRequest}
                    onRemoveFriend={handleRemoveFriend}
                    onUnblockUser={handleUnblockUser}
                    friends={getFriendUserIds()}
                    pendingRequests={getPendingRequestUserIds()}
                    blockedUsers={blockedUsers}
                    isMobile={isMobile}
                  />
                )}
              </motion.div>
            )}
            {activeTab === 'blocked' && (
              <motion.div
                key="blocked"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Blocked Users
                    {blockedUsers.length > 0 && (
                      <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full">
                        {blockedUsers.length}
                      </span>
                    )}
                  </h2>
                  <button
                    onClick={fetchBlockedUsers}
                    className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                {blockedUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-zinc-900 flex items-center justify-center mb-6 ring-1 ring-slate-100 dark:ring-slate-700">
                      <UserX className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      No blocked users
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      You haven't blocked anyone yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allUsers
                      .filter(user => blockedUsers.includes(user._id))
                      .map((user) => (
                        <div key={user._id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl border border-slate-200 dark:border-zinc-800 hover:shadow-md transition-all">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-red-500/20">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-slate-900 dark:text-white truncate">
                                {user.name || 'Unknown User'}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                Blocked
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnblockUser(user._id)}
                            className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-zinc-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
