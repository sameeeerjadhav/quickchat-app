'use client';

import { User, Friend } from '../../types';
import { UserPlus, UserMinus, Video, Phone, MoreVertical, MessageSquare } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface FriendListProps {
  friends: Friend[];
  currentUserId: string;
  onSelectFriend: (friendId: string) => void;
  onRemoveFriend: (friendId: string) => void;
  onStartVideoCall?: (friendId: string) => void;
  onStartAudioCall?: (friendId: string) => void;
  isMobile?: boolean;
}

export default function FriendList({
  friends,
  currentUserId,
  onSelectFriend,
  onRemoveFriend,
  onStartVideoCall,
  onStartAudioCall,
  isMobile = false,
}: FriendListProps) {
  const [showMenuFor, setShowMenuFor] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenuFor(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle touch feedback
  const handleActionStart = (action: string) => {
    setActiveAction(action);
  };

  const handleActionEnd = () => {
    setTimeout(() => setActiveAction(null), 150);
  };

  if (friends.length === 0) {
    return (
      <div className="p-4 sm:p-8 text-center">
        <div className={`mx-auto ${isMobile ? 'h-12 w-12' : 'h-16 w-16'
          } rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center mb-3 sm:mb-4`}>
          <UserPlus className={`${isMobile ? 'h-6 w-6' : 'h-8 w-8'
            } text-gray-400 dark:text-gray-500`} />
        </div>
        <h3 className={`${isMobile ? 'text-base' : 'text-lg'
          } font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2`}>
          No Friends Yet
        </h3>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'
          } text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 px-4`}>
          Add friends to start chatting!
        </p>
        <button
          onClick={() => window.location.href = '/friends?tab=search'}
          className={`${isMobile ? 'px-4 py-2 text-sm' : 'px-5 py-2.5'
            } bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors active:scale-95`}
        >
          Find Friends
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1 sm:space-y-2 p-1 sm:p-2">
      <h3 className={`${isMobile ? 'text-xs px-1 mb-1' : 'text-sm px-2 mb-2'
        } font-semibold text-gray-700 dark:text-gray-300`}>
        Friends ({friends.length})
      </h3>
      {friends.map((friend) => (
        <div
          key={friend._id}
          className={`group flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'
            } rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors active:bg-gray-100 dark:active:bg-gray-700`}
          onClick={() => onSelectFriend(friend.user._id)}
          onTouchStart={() => handleActionStart(`select-${friend._id}`)}
          onTouchEnd={handleActionEnd}
        >
          <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'
                } rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold ${isMobile ? 'text-sm' : 'text-base'
                }`}>
                {friend.user.name.charAt(0).toUpperCase()}
              </div>
              {/* Status indicator - commented out as per previous request */}
              {/* {friend.user.isOnline && (
                <div className={`absolute bottom-0 right-0 ${
                  isMobile ? 'h-2 w-2' : 'h-3 w-3'
                } rounded-full bg-green-500 border-2 border-white dark:border-zinc-800`}></div>
              )} */}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className={`${isMobile ? 'text-sm' : 'text-base'
                } font-medium text-gray-900 dark:text-white truncate`}>
                {friend.user.name}
              </h4>
              {/* Status text - commented out */}
              {/* <p className={`${
                isMobile ? 'text-[10px]' : 'text-xs'
              } text-gray-500 dark:text-gray-400 truncate`}>
                {friend.user.isOnline ? 'Online' : 'Offline'}
              </p> */}
            </div>
          </div>

          <div className="flex items-center space-x-0.5 sm:space-x-1" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectFriend(friend.user._id);
              }}
              className={`${isMobile ? 'p-1.5' : 'p-2'
                } text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors active:scale-95 touch-target`}
              title="Message"
              aria-label={`Message ${friend.user.name}`}
            >
              <MessageSquare className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
                }`} />
            </button>

            {onStartVideoCall && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartVideoCall(friend.user._id);
                }}
                className={`${isMobile ? 'p-1.5' : 'p-2'
                  } text-gray-500 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors active:scale-95 touch-target`}
                title="Video Call"
                aria-label={`Video call ${friend.user.name}`}
              >
                <Video className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
                  }`} />
              </button>
            )}

            {onStartAudioCall && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartAudioCall(friend.user._id);
                }}
                className={`${isMobile ? 'p-1.5' : 'p-2'
                  } text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors active:scale-95 touch-target`}
                title="Voice Call"
                aria-label={`Voice call ${friend.user.name}`}
              >
                <Phone className={`${isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
                  }`} />
              </button>
            )}

            {/* More options menu - Hide on mobile if space is tight */}
            {!isMobile && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenuFor(showMenuFor === friend._id ? null : friend._id);
                  }}
                  className={`p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors touch-target`}
                  aria-label="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {showMenuFor === friend._id && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 z-20 animate-fade-in">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFriend(friend.user._id);
                        setShowMenuFor(null);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 rounded-t-lg"
                    >
                      <UserMinus className="h-4 w-4" />
                      Remove Friend
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile: Show remove button directly */}
            {isMobile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFriend(friend.user._id);
                }}
                className={`p-1.5 text-red-500 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-95 touch-target`}
                title="Remove Friend"
                aria-label={`Remove ${friend.user.name}`}
              >
                <UserMinus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Footer stats */}
      {friends.length > 0 && (
        <div className={`${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'
          } border-t border-gray-200 dark:border-zinc-800 mt-2 sm:mt-3`}>
          <div className="text-center">
            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'
              } text-gray-500 dark:text-gray-400`}>
              {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
