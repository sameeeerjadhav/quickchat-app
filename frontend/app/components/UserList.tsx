'use client';

import React from 'react';
import { User } from '../../types';
import { FiUser, FiCheck } from 'react-icons/fi';
import { FaCircle } from 'react-icons/fa';
import { useState, useEffect } from 'react';

interface UserListProps {
  users: User[];
  currentUserId: string;
  selectedUser: string | null;
  onSelectUser: (userId: string) => void;
}

const UserList = React.memo(function UserList({ users, currentUserId, selectedUser, onSelectUser }: UserListProps) {
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch friends when component mounts
  useEffect(() => {
    fetchFriends();
  }, [currentUserId]);

  // Function to fetch friends from API
  const fetchFriends = async () => {
    try {
      if (!currentUserId) return;

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) return;

      // Fetch friends from API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/friends/friends`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();

        let friendsData: any[] = [];

        // Handle different response structures
        if (Array.isArray(data)) {
          friendsData = data;
        } else if (data.data && Array.isArray(data.data)) {
          friendsData = data.data;
        } else if (data.success && Array.isArray(data.data)) {
          friendsData = data.data;
        }

        // Extract friend user objects from friends data
        const friendUsers: User[] = [];

        friendsData.forEach((friend: any) => {
          // Try to extract user object from different possible structures
          let userObject = friend.user || friend;

          if (userObject && userObject._id && userObject._id !== currentUserId) {
            // Create a User object from the friend data - only include fields from the User interface
            const user: User = {
              _id: userObject._id,
              name: userObject.name || userObject.username || 'Unknown User',
              email: userObject.email || '',
              isOnline: userObject.isOnline || false,
              lastSeen: userObject.lastSeen || new Date().toISOString(),
              avatar: userObject.avatar || userObject.profilePicture || undefined
            };
            friendUsers.push(user);
          }
        });

        setFriends(friendUsers);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate friends by status (ONLY show friends, not all users)
  // const onlineFriends = friends.filter(friend => friend.isOnline); // Commented out
  // const offlineFriends = friends.filter(friend => !friend.isOnline); // Commented out
  const currentUser = users.find(user => user._id === currentUserId);

  // Telegram-style timestamp
  const formatLastSeen = (user: User) => {
    // if (user.isOnline) { // Commented out
    //   return 'online';
    // }

    if (!user.lastSeen) {
      return 'recently';
    }

    // Handle both Date objects and string timestamps
    let lastSeenDate: Date;
    if (typeof user.lastSeen === 'string') {
      lastSeenDate = new Date(user.lastSeen);
    } else {
      lastSeenDate = user.lastSeen;
    }

    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));

    if (diffMinutes < 1) {
      return 'just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffMinutes < 1440) {
      return `${Math.floor(diffMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffMinutes / 1440)}d ago`;
    }
  };

  // Telegram-style initials for avatar
  const getInitials = (name: string) => {
    if (!name || name.trim() === '') return 'U';

    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Generate Telegram-like color based on name
  const getAvatarColor = (name: string) => {
    if (!name) return 'bg-blue-500';

    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-indigo-500',
      'bg-slate-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  const renderUserItem = (user: User) => {
    const isSelected = selectedUser === user._id;

    return (
      <div
        key={user._id}
        onClick={() => onSelectUser(user._id)}
        className={`group flex items-center p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 ${isSelected
          ? 'bg-blue-600 shadow-md shadow-blue-900/20'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
      >
        {/* Telegram-style avatar with status indicator */}
        <div className="relative flex-shrink-0">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className={`h-12 w-12 rounded-full object-cover border-2 ${isSelected ? 'border-blue-500' : 'border-white dark:border-slate-800'}`}
            />
          ) : (
            <div className={`h-12 w-12 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white font-medium text-lg border-2 ${isSelected ? 'border-blue-500' : 'border-white dark:border-slate-800'}`}>
              {getInitials(user.name)}
            </div>
          )}

          {/* Online status indicator - Telegram style */}
          {user.isOnline ? (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-black">
              <div className="h-full w-full rounded-full bg-green-400 animate-pulse"></div>
            </div>
          ) : (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-zinc-500 dark:bg-zinc-600 border-2 border-white dark:border-black">
            </div>
          )}

          {/* Friend badge - Only show if not selected (too much noise otherwise) */}
          {!isSelected && (
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-slate-100 dark:bg-zinc-900 border-2 border-white dark:border-zinc-900 flex items-center justify-center">
              <FiCheck className="h-3 w-3 text-blue-500" />
            </div>
          )}
        </div>

        {/* User info with Telegram-style layout */}
        <div className="ml-3 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-semibold truncate text-[15px] ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              {user.name}
            </h4>
            {isSelected && (
              <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full">Active</span>
            )}
          </div>

          {/* Last message preview (Telegram shows last message) */}
          <div className="flex items-center justify-between mt-0.5">
            <p className={`text-sm truncate flex-1 ${isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'}`}>
              {user.email || 'Friend on QuickChat'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800">
        {/* Current user profile */}
        {currentUser && (
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50">
            <div className="flex items-center">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className={`h-14 w-14 rounded-full ${getAvatarColor(currentUser.name)} flex items-center justify-center text-white font-medium text-xl`}>
                  {getInitials(currentUser.name)}
                </div>
              )}
              <div className="ml-3 flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                  {currentUser.name}
                </h3>
                {/* Online status for current user */}
                <div className="flex items-center mt-1">
                  <FaCircle className="h-2 w-2 text-green-500 mr-1.5 animate-pulse" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    online
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading friends...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800">
      {/* Current user profile at top - Telegram style */}
      {currentUser && (
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center">
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <div className={`h-14 w-14 rounded-full ${getAvatarColor(currentUser.name)} flex items-center justify-center text-white font-medium text-xl`}>
                {getInitials(currentUser.name)}
              </div>
            )}
            <div className="ml-3 flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {currentUser.name}
              </h3>
              {/* Status and friend count */}
              <div className="flex items-center mt-1">
                <FaCircle className="h-2 w-2 text-green-500 mr-1.5 animate-pulse" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  online
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-500 ml-2">
                  • {friends.length} friends
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search bar placeholder - REMOVED */}
      {/* <div className="p-3 border-b border-gray-200 dark:border-zinc-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full px-4 py-2.5 pl-10 bg-gray-100 dark:bg-zinc-950 rounded-lg border-0 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div> */}

      {/* User list with scroll */}
      <div className="flex-1 overflow-y-auto">
        {/* Empty state when no friends */}
        {friends.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-950 flex items-center justify-center">
              <FiUser className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No friends yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-sm mx-auto">
              Add friends to start chatting. Go to the Friends page to connect with people.
            </p>
            <button
              onClick={() => window.location.href = '/friends'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              Go to Friends
            </button>
          </div>
        ) : (
          <>
            {/* Friends list - No online/offline separation */}
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Friends — {friends.length}
              </h3>
            </div>
            {friends.map((friend) => renderUserItem(friend))}

            {/* Online/Offline sections - COMMENTED OUT */}
            {/* {onlineFriends.length > 0 && (
              <>
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Online — {onlineFriends.length}
                  </h3>
                </div>
                {onlineFriends.map((friend) => renderUserItem(friend))}
              </>
            )}
            
            {offlineFriends.length > 0 && (
              <>
                <div className="px-4 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Offline — {offlineFriends.length}
                  </h3>
                </div>
                {offlineFriends.map((friend) => renderUserItem(friend))}
              </>
            )} */}
          </>
        )}
      </div>

      {/* Footer with friends count */}
      {friends.length > 0 && (
        <div className="p-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-950/50">
          <div className="text-center text-xs text-gray-500 dark:text-gray-400">
            {friends.length} friends
          </div>
        </div>
      )}
    </div>
  );
});

export default UserList;
