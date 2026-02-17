'use client';

import { FriendRequest } from '../../types';
import { UserPlus, UserCheck, UserX, Clock, Check, X, MoreVertical } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface FriendRequestsProps {
  requests: FriendRequest[];
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  loading?: boolean;
  isMobile?: boolean;
}

export default function FriendRequests({
  requests,
  onAcceptRequest,
  onRejectRequest,
  loading = false,
  isMobile = false,
}: FriendRequestsProps) {
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

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

  if (loading) {
    return (
      <div className={`${isMobile ? 'p-3' : 'p-4'
        } text-center`}>
        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
        <p className={`${isMobile ? 'text-xs mt-1.5' : 'text-sm mt-2'
          } text-gray-600 dark:text-gray-400`}>
          Loading requests...
        </p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className={`${isMobile ? 'p-4' : 'p-6'
        } text-center`}>
        <div className={`mx-auto ${isMobile ? 'h-10 w-10' : 'h-12 w-12'
          } rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center mb-3`}>
          <UserPlus className={`${isMobile ? 'h-5 w-5' : 'h-6 w-6'
            } text-gray-400 dark:text-gray-500`} />
        </div>
        <h3 className={`${isMobile ? 'text-base' : 'text-lg'
          } font-semibold text-gray-900 dark:text-white mb-1`}>
          No Friend Requests
        </h3>
        <p className={`${isMobile ? 'text-xs' : 'text-sm'
          } text-gray-600 dark:text-gray-400 px-2`}>
          When someone sends you a friend request, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-3 p-1 sm:p-2">
      <div className={`${isMobile ? 'px-1 mb-1' : 'px-2 mb-2'
        } flex items-center justify-between`}>
        <h3 className={`${isMobile ? 'text-xs' : 'text-sm'
          } font-semibold text-gray-700 dark:text-gray-300`}>
          Friend Requests ({requests.length})
        </h3>
        {requests.length > 0 && (
          <button
            onClick={() => {
              // Handle bulk actions if needed
            }}
            className={`${isMobile ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'
              } text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors`}
          >
            Clear All
          </button>
        )}
      </div>

      {requests.map((request) => (
        <div
          key={request._id}
          className={`bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-700 ${isMobile ? 'p-3' : 'p-4'
            } hover:shadow-sm transition-all duration-200 active:scale-[0.995]`}
          onClick={() => isMobile && setExpandedRequest(expandedRequest === request._id ? null : request._id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className={`${isMobile ? 'h-8 w-8' : 'h-10 w-10'
                } rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold ${isMobile ? 'text-sm' : 'text-base'
                } flex-shrink-0`}>
                {request.from.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 sm:gap-2">
                  <h4 className={`${isMobile ? 'text-sm' : 'text-base'
                    } font-medium text-gray-900 dark:text-white truncate`}>
                    {request.from.name}
                  </h4>
                  {/* Mobile: Show status badge */}
                  {isMobile && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                      Pending
                    </span>
                  )}
                </div>
                <p className={`${isMobile ? 'text-[10px]' : 'text-xs'
                  } text-gray-500 dark:text-gray-400 truncate mt-0.5`}>
                  {request.from.email}
                </p>
                <div className="flex items-center mt-1">
                  <Clock className={`${isMobile ? 'h-2.5 w-2.5' : 'h-3 w-3'
                    } text-gray-400 mr-1 flex-shrink-0`} />
                  <span className={`${isMobile ? 'text-[10px]' : 'text-xs'
                    } text-gray-500 dark:text-gray-400 truncate`}>
                    {new Date(request.sentAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      ...(isMobile ? {} : { year: 'numeric' })
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 sm:gap-2" ref={actionsMenuRef}>
              {/* Desktop: Show both buttons */}
              {!isMobile ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcceptRequest(request._id);
                    }}
                    className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 active:scale-95 touch-target"
                    title="Accept"
                    aria-label={`Accept friend request from ${request.from.name}`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRejectRequest(request._id);
                    }}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 active:scale-95 touch-target"
                    title="Reject"
                    aria-label={`Reject friend request from ${request.from.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                /* Mobile: Show menu for actions */
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActionsFor(showActionsFor === request._id ? null : request._id);
                    }}
                    className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors active:scale-95 touch-target"
                    aria-label="Request options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {showActionsFor === request._id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 z-10 animate-fade-in">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcceptRequest(request._id);
                          setShowActionsFor(null);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-3 rounded-t-lg"
                      >
                        <Check className="h-4 w-4" />
                        Accept Request
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRejectRequest(request._id);
                          setShowActionsFor(null);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                      >
                        <X className="h-4 w-4" />
                        Reject Request
                      </button>
                      <div className="border-t border-gray-200 dark:border-zinc-700 my-1"></div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // View profile action
                          setShowActionsFor(null);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center gap-3 rounded-b-lg"
                      >
                        <UserPlus className="h-4 w-4" />
                        View Profile
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expanded view on mobile for details */}
          {isMobile && expandedRequest === request._id && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Sent on:</span>
                  <span className="text-xs text-gray-900 dark:text-white font-medium">
                    {new Date(request.sentAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full">
                    Pending
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcceptRequest(request._id);
                    }}
                    className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg font-medium transition-colors active:scale-95 flex items-center justify-center gap-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRejectRequest(request._id);
                    }}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-medium transition-colors active:scale-95 flex items-center justify-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Footer for requests */}
      {requests.length > 0 && (
        <div className={`${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'
          } border-t border-gray-200 dark:border-zinc-800 mt-2 sm:mt-3`}>
          <div className="text-center">
            <p className={`${isMobile ? 'text-[10px]' : 'text-xs'
              } text-gray-500 dark:text-gray-400`}>
              You have {requests.length} pending {requests.length === 1 ? 'request' : 'requests'}
            </p>
            <button
              onClick={() => {
                // Handle mark all as read or other bulk action
              }}
              className={`${isMobile ? 'text-[10px] mt-1' : 'text-xs mt-1.5'
                } text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors`}
            >
              View all friend requests
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
