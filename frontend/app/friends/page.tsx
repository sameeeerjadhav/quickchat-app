'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, Bell, UserPlus, UserX, Check, X, RefreshCw, ChevronLeft, Menu } from 'lucide-react';
import { authAPI, friendAPI, userAPI } from '../../lib/api';
import { FriendRequest, Friend } from '../../types';
import FriendList from '../components/FriendList';
import FriendRequests from '../components/FriendRequests';
import UserSearch from '../components/UserSearch';
import ThemeToggle from '../components/ThemeToggle';
import Link from 'next/link';
import { usePolling } from '../hooks/usePolling';

export default function FriendsPage() {
  const router = useRouter();
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

  // ======================
  // AUTO-REFRESH FUNCTIONS
  // ======================

  const fetchFriends = useCallback(async () => {
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
      return friends; // Return current state on error
    }
  }, [friends]);

  const fetchRequests = useCallback(async () => {
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
      return requests; // Return current state on error
    }
  }, [requests]);

  const fetchAllUsers = useCallback(async () => {
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
      return allUsers; // Return current state on error
    }
  }, [currentUserId, allUsers]);

  const fetchBlockedUsers = useCallback(async () => {
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
      return blockedUsers; // Return current state on error
    }
  }, [blockedUsers]);

  // Auto-refresh active tab data every 10 seconds
  usePolling(() => {
    if (!currentUserId || loading) return;
    
    console.log('🔄 Auto-refreshing friends page data...');
    
    switch (activeTab) {
      case 'friends':
        fetchFriends();
        break;
      case 'requests':
        fetchRequests();
        break;
      case 'search':
        fetchAllUsers();
        break;
      case 'blocked':
        fetchBlockedUsers();
        break;
    }
  }, 3000); // 10 seconds

  // Auto-refresh all data when tab changes
  useEffect(() => {
    if (!currentUserId || loading) return;
    
    const refreshTabData = async () => {
      switch (activeTab) {
        case 'friends':
          await fetchFriends();
          break;
        case 'requests':
          await fetchRequests();
          break;
        case 'search':
          await fetchAllUsers();
          break;
        case 'blocked':
          await fetchBlockedUsers();
          break;
      }
    };
    
    refreshTabData();
  }, [activeTab, currentUserId, loading, fetchFriends, fetchRequests, fetchAllUsers, fetchBlockedUsers]);

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
      showNotification('success', 'Data refreshed!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showNotification('error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await friendAPI.sendRequest(userId);
      showNotification('success', 'Friend request sent!');
      // Refresh relevant data immediately
      await Promise.all([fetchRequests(), fetchAllUsers()]);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleCancelRequest = async (userId: string) => {
    try {
      await friendAPI.cancelRequest(userId);
      showNotification('success', 'Request cancelled!');
      // Refresh relevant data immediately
      await Promise.all([fetchRequests(), fetchAllUsers()]);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendAPI.acceptRequest(requestId);
      showNotification('success', 'Friend request accepted!');
      // Refresh all data immediately
      await refreshAllData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendAPI.rejectRequest(requestId);
      showNotification('success', 'Friend request rejected!');
      // Refresh relevant data immediately
      await Promise.all([fetchRequests(), fetchAllUsers()]);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    try {
      await friendAPI.removeFriend(friendId);
      showNotification('success', 'Friend removed!');
      // Refresh relevant data immediately
      await Promise.all([fetchFriends(), fetchAllUsers()]);
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to remove friend');
    }
  };

  const handleBlockUser = async (userId: string) => {
    try {
      await friendAPI.blockUser(userId);
      showNotification('success', 'User blocked!');
      // Refresh all data immediately
      await refreshAllData();
    } catch (err: any) {
      showNotification('error', err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      await friendAPI.unblockUser(userId);
      showNotification('success', 'User unblocked!');
      // Refresh all data immediately
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-4 sm:p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md mx-4">
          <div className="animate-spin rounded-full h-12 sm:h-16 w-12 sm:w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4 sm:mb-6"></div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-2">Loading Friends</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Please wait while we load your friend data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 px-3 sm:px-4 py-3 flex items-center justify-between sticky top-0 z-50 bg-white dark:bg-gray-900">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {isMobile && (
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          
          <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'} rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center`}>
            <Users className={isMobile ? "h-4 w-4 text-white" : "h-5 w-5 text-white"} />
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base truncate">Friends</h1>
            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-gray-500 truncate`}>
              {friends.length} friends • {requests.length} pending
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {!isMobile && (
            <>
              <Link 
                href="/chat"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium"
              >
                ← Back to Chat
              </Link>
              
              <button
                onClick={refreshAllData}
                disabled={refreshing}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg ${
                  refreshing 
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
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
              className={`p-2 rounded-lg ${
                refreshing 
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400' 
                  : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Tabs Menu */}
      {isMobile && showMobileMenu && (
        <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl animate-slide-in">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Menu</h3>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-2">
              <Link
                href="/chat"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
        <div className={`fixed top-4 right-4 z-50 p-3 sm:p-4 rounded-lg shadow-lg flex items-center max-w-xs sm:max-w-md ${
          notification.type === 'success' 
            ? 'bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800' 
            : 'bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800'
        }`}>
          {notification.type === 'success' ? (
            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
          ) : (
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
          )}
          <p className={`text-xs sm:text-sm ${
            notification.type === 'success' 
              ? 'text-green-800 dark:text-green-400' 
              : 'text-red-800 dark:text-red-400'
          }`}>
            {notification.message}
          </p>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 px-3 py-1 text-center">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          🔄 Auto-refreshing every 10 seconds
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-2 sm:p-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4 sm:mb-6 overflow-x-auto">
          {[
            { id: 'friends', icon: UserCheck, label: 'Friends', count: friends.length },
            { id: 'requests', icon: Bell, label: 'Requests', count: requests.length },
            { id: 'search', icon: UserPlus, label: 'Add', count: null },
            { id: 'blocked', icon: UserX, label: 'Blocked', count: blockedUsers.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center px-2 sm:px-4 py-2 text-xs sm:text-sm border-b-2 font-medium whitespace-nowrap flex-1 sm:flex-none ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'}`} />
              <span className="truncate">{isMobile ? tab.label : `${tab.label} ${tab.count !== null ? `(${tab.count})` : ''}`}</span>
              {isMobile && tab.count !== null && tab.count > 0 && (
                <span className="ml-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-400 text-[10px] px-1 rounded">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          {activeTab === 'friends' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}>
                  {isMobile ? 'Friends' : 'My Friends'}
                </h2>
                {!isMobile && (
                  <button
                    onClick={fetchFriends}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </button>
                )}
              </div>
              
              {friends.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className={`mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center ${
                    isMobile ? 'h-16 w-16' : 'h-24 w-24'
                  }`}>
                    <UserCheck className={isMobile ? "h-8 w-8 text-gray-400" : "h-12 w-12 text-gray-400"} />
                  </div>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 dark:text-white mb-2`}>
                    No friends yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm sm:text-base px-2">
                    Start by adding friends from the "Add Friends" tab.
                  </p>
                  <div className={`flex ${isMobile ? 'flex-col gap-2' : 'space-x-4'} justify-center`}>
                    <button
                      onClick={() => setActiveTab('search')}
                      className={`${
                        isMobile ? 'w-full px-4 py-2.5 text-sm' : 'px-6 py-3'
                      } bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium`}
                    >
                      Find Friends
                    </button>
                    {!isMobile && (
                      <button
                        onClick={refreshAllData}
                        className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                      >
                        Refresh All Data
                      </button>
                    )}
                  </div>
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
            </>
          )}
          
          {activeTab === 'requests' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}>
                  {isMobile ? 'Requests' : 'Friend Requests'}
                </h2>
                {!isMobile && (
                  <button
                    onClick={fetchRequests}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh
                  </button>
                )}
              </div>
              
              {requests.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className={`mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 flex items-center justify-center ${
                    isMobile ? 'h-16 w-16' : 'h-24 w-24'
                  }`}>
                    <Bell className={isMobile ? "h-8 w-8 text-gray-400" : "h-12 w-12 text-gray-400"} />
                  </div>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 dark:text-white mb-2`}>
                    No pending requests
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm sm:text-base px-2">
                    When someone sends you a friend request, it will appear here.
                  </p>
                  {!isMobile && (
                    <button
                      onClick={refreshAllData}
                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                    >
                      Refresh All Data
                    </button>
                  )}
                </div>
              ) : (
                <FriendRequests
                  requests={requests}
                  onAcceptRequest={handleAcceptRequest}
                  onRejectRequest={handleRejectRequest}
                  isMobile={isMobile}
                />
              )}
            </>
          )}
          
          {activeTab === 'search' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}>
                  {isMobile ? 'Add Friends' : 'Add Friends'}
                </h2>
                <div className="flex items-center gap-2">
                  {!isMobile && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {allUsers.length} users found
                    </span>
                  )}
                  <button
                    onClick={fetchAllUsers}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {isMobile ? '' : 'Refresh'}
                  </button>
                </div>
              </div>
              
              {allUsers.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className={`mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center ${
                    isMobile ? 'h-16 w-16' : 'h-24 w-24'
                  }`}>
                    <UserPlus className={isMobile ? "h-8 w-8 text-gray-400" : "h-12 w-12 text-gray-400"} />
                  </div>
                  <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 dark:text-white mb-2`}>
                    No users found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto text-sm sm:text-base px-2">
                    Try refreshing the list.
                  </p>
                  <button
                    onClick={refreshAllData}
                    className={`${
                      isMobile ? 'w-full px-4 py-2.5' : 'px-6 py-3'
                    } bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium`}
                  >
                    Refresh All Data
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
            </>
          )}
          
          {activeTab === 'blocked' && (
            <div>
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white`}>
                  {isMobile ? 'Blocked' : 'Blocked Users'}
                </h2>
                <div className="flex items-center gap-2">
                  {!isMobile && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {blockedUsers.length} blocked users
                    </span>
                  )}
                  <button
                    onClick={fetchBlockedUsers}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {isMobile ? '' : 'Refresh'}
                  </button>
                </div>
              </div>
              
              {blockedUsers.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className={`mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 flex items-center justify-center ${
                    isMobile ? 'h-16 w-16' : 'h-24 w-24'
                  }`}>
                    <UserX className={isMobile ? "h-8 w-8 text-gray-400" : "h-12 w-12 text-gray-400"} />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">No blocked users</p>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-2 px-4">
                    Users you block will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {allUsers
                    .filter(user => blockedUsers.includes(user._id))
                    .map((user) => (
                      <div key={user._id} className={`flex items-center justify-between ${
                        isMobile ? 'p-3' : 'p-4'
                      } bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}>
                        <div className="flex items-center space-x-2 sm:space-x-3">
                          <div className={`${
                            isMobile ? 'h-10 w-10 text-sm' : 'h-12 w-12 text-lg'
                          } rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white font-medium`}>
                            {user.name?.charAt(0) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <h4 className={`${
                              isMobile ? 'text-sm' : 'text-base'
                            } font-medium text-gray-900 dark:text-white truncate`}>
                              {user.name || 'Unknown User'}
                            </h4>
                            <p className={`${
                              isMobile ? 'text-xs' : 'text-sm'
                            } text-gray-500 dark:text-gray-400 truncate`}>
                              {user.email || 'No email'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblockUser(user._id)}
                          className={`${
                            isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
                          } bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors`}
                        >
                          {isMobile ? 'Unblock' : 'Unblock'}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-2 z-40">
          <div className="flex justify-around">
            <Link
              href="/chat"
              className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <ChevronLeft className="h-5 w-5 mb-1" />
              <span className="text-xs">Chats</span>
            </Link>
            <button
              onClick={refreshAllData}
              className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <RefreshCw className={`h-5 w-5 mb-1 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs">Refresh</span>
            </button>
            <button
              onClick={() => setShowMobileMenu(true)}
              className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Menu className="h-5 w-5 mb-1" />
              <span className="text-xs">Menu</span>
            </button>
          </div>
        </div>
      )}

      {/* Add space for mobile bottom nav */}
      {isMobile && <div className="h-16"></div>}
    </div>
  );
}