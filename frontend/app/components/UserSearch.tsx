'use client';

import { User } from '../../types';
import { Search, UserPlus, UserCheck, UserMinus, UserX, Clock, MoreVertical, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface UserSearchProps {
  users: User[];
  currentUserId: string;
  onSendRequest: (userId: string) => void;
  onCancelRequest?: (userId: string) => void;
  onRemoveFriend?: (userId: string) => void;
  onUnblockUser?: (userId: string) => void;
  friends?: string[]; // Array of friend IDs
  pendingRequests?: string[]; // Array of user IDs where request is pending
  blockedUsers?: string[]; // Array of blocked user IDs
  isMobile?: boolean;
}

export default function UserSearch({
  users,
  currentUserId,
  onSendRequest,
  onCancelRequest,
  onRemoveFriend,
  onUnblockUser,
  friends = [],
  pendingRequests = [],
  blockedUsers = [],
  isMobile = false,
}: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsFor(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredUsers = users.filter(user =>
    user._id !== currentUserId &&
    (user.name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(debouncedQuery.toLowerCase()))
  );

  const getUserStatus = (userId: string) => {
    if (friends.includes(userId)) return 'friend';
    if (pendingRequests.includes(userId)) return 'pending';
    if (blockedUsers.includes(userId)) return 'blocked';
    return 'none';
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search Input */}
      <div className="relative px-1 sm:px-0">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isMobile ? 'h-4 w-4' : 'h-5 w-5'
          } text-gray-400 ${searchQuery ? 'opacity-50' : ''}`} />
        <input
          type="text"
          placeholder={isMobile ? "Search users..." : "Search users by name or email..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full ${isMobile ? 'pl-9 pr-8 py-2 text-sm' : 'pl-10 pr-9 py-2.5'
            } bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white transition-all duration-200`}
          aria-label="Search users"
        />

        {/* Clear search button */}
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors touch-target"
            aria-label="Clear search"
            type="button"
          >
            <X className={isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </button>
        )}

        {/* Search results count */}
        {debouncedQuery && (
          <div className="absolute -bottom-5 left-0">
            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'
              } text-gray-500 dark:text-gray-400`}>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'result' : 'results'}
            </p>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className={`space-y-2 max-h-[400px] overflow-y-auto ${isMobile ? 'px-1' : ''
        }`}>
        {filteredUsers.map((user) => {
          const status = getUserStatus(user._id);

          return (
            <div
              key={user._id}
              className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'
                } bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 hover:shadow-sm transition-all duration-200 active:scale-[0.995]`}
            >
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'
                    } rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold ${isMobile ? 'text-sm' : 'text-base'
                    }`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {/* Status indicator - commented out as per previous request */}
                  {/* {user.isOnline && (
                    <div className={`absolute bottom-0 right-0 ${
                      isMobile ? 'h-2 w-2' : 'h-3 w-3'
                    } rounded-full bg-green-500 border-2 border-white dark:border-zinc-800`}></div>
                  )} */}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 flex-wrap">
                    <h4 className={`${isMobile ? 'text-sm' : 'text-base'
                      } font-medium text-gray-900 dark:text-white truncate`}>
                      {user.name}
                    </h4>
                    {/* Status badge - only show on mobile to save space */}
                    {isMobile && status !== 'none' && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${status === 'friend'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {status === 'friend' ? 'Friend' : status === 'pending' ? 'Pending' : 'Blocked'}
                      </span>
                    )}
                  </div>
                  <p className={`${isMobile ? 'text-[10px]' : 'text-sm'
                    } text-gray-500 dark:text-gray-400 truncate mt-0.5`}>
                    {user.email}
                  </p>

                  {/* Desktop status row */}
                  {!isMobile && (
                    <div className="flex items-center mt-1 flex-wrap gap-1">
                      {/* Status badges - commented out */}
                      {/* <span className={`text-xs px-2 py-0.5 rounded-full ${
                        user.isOnline 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-zinc-800 dark:text-gray-400'
                      }`}>
                        {user.isOnline ? 'Online' : 'Offline'}
                      </span> */}
                      {status !== 'none' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${status === 'friend'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                          {status === 'friend' ? 'Friend' : status === 'pending' ? 'Request Sent' : 'Blocked'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center" ref={actionsMenuRef}>
                {/* Desktop: Full buttons */}
                {!isMobile ? (
                  <div>
                    {status === 'none' && (
                      <button
                        onClick={() => onSendRequest(user._id)}
                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm active:scale-95 touch-target shadow-sm"
                        aria-label={`Add ${user.name} as friend`}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                      </button>
                    )}

                    {status === 'pending' && onCancelRequest && (
                      <button
                        onClick={() => onCancelRequest(user._id)}
                        className="flex items-center px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm active:scale-95 touch-target"
                        aria-label={`Cancel friend request to ${user.name}`}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Cancel
                      </button>
                    )}

                    {status === 'friend' && onRemoveFriend && (
                      <button
                        onClick={() => onRemoveFriend(user._id)}
                        className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm active:scale-95 touch-target"
                        aria-label={`Remove ${user.name} from friends`}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    )}

                    {status === 'blocked' && onUnblockUser && (
                      <button
                        onClick={() => onUnblockUser(user._id)}
                        className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm active:scale-95 touch-target"
                        aria-label={`Unblock ${user.name}`}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Unblock
                      </button>
                    )}
                  </div>
                ) : (
                  /* Mobile: Compact dropdown menu */
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActionsFor(showActionsFor === user._id ? null : user._id);
                      }}
                      className={`p-1.5 rounded-lg ${status === 'none'
                        ? 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20'
                        : status === 'pending'
                          ? 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20'
                          : status === 'friend'
                            ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                            : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                        } transition-colors active:scale-95 touch-target`}
                      aria-label="User actions"
                    >
                      {status === 'none' && <UserPlus className="h-4 w-4" />}
                      {status === 'pending' && <Clock className="h-4 w-4" />}
                      {status === 'friend' && <UserMinus className="h-4 w-4" />}
                      {status === 'blocked' && <UserX className="h-4 w-4" />}
                    </button>

                    {showActionsFor === user._id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 z-10 animate-fade-in">
                        <div className="py-2">
                          <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>

                          <div className="py-1">
                            {status === 'none' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSendRequest(user._id);
                                  setShowActionsFor(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center gap-3"
                              >
                                <UserPlus className="h-4 w-4" />
                                Add Friend
                              </button>
                            )}

                            {status === 'pending' && onCancelRequest && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCancelRequest(user._id);
                                  setShowActionsFor(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center gap-3"
                              >
                                <Clock className="h-4 w-4" />
                                Cancel Request
                              </button>
                            )}

                            {status === 'friend' && onRemoveFriend && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveFriend(user._id);
                                  setShowActionsFor(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                              >
                                <UserMinus className="h-4 w-4" />
                                Remove Friend
                              </button>
                            )}

                            {status === 'blocked' && onUnblockUser && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUnblockUser(user._id);
                                  setShowActionsFor(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-3"
                              >
                                <UserX className="h-4 w-4" />
                                Unblock User
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredUsers.length === 0 && (
          <div className={`text-center ${isMobile ? 'py-6' : 'py-8'
            }`}>
            <Search className={`${isMobile ? 'h-8 w-8' : 'h-12 w-12'
              } text-gray-400 mx-auto mb-3`} />
            <p className={`${isMobile ? 'text-sm' : 'text-base'
              } text-gray-600 dark:text-gray-400 px-4`}>
              {debouncedQuery ? 'No users found' : 'Search for users to add as friends'}
            </p>
            {!debouncedQuery && (
              <p className={`${isMobile ? 'text-xs mt-1' : 'text-sm mt-2'
                } text-gray-500 dark:text-gray-400 px-4`}>
                Try searching by name or email address
              </p>
            )}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      {filteredUsers.length > 0 && (
        <div className={`${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'
          } border-t border-gray-200 dark:border-zinc-700 mt-2`}>
          <div className="flex items-center justify-between">
            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'
              } text-gray-500 dark:text-gray-400`}>
              Showing {filteredUsers.length} of {users.filter(u => u._id !== currentUserId).length} users
            </p>
            <div className="flex items-center gap-2">
              <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'
                } px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`}>
                {friends.length} friends
              </span>
              <span className={`${isMobile ? 'text-[8px]' : 'text-[10px]'
                } px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`}>
                {pendingRequests.length} pending
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
