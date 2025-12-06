'use client';

import { useState } from 'react';
import { FiUser, FiVideo, FiPhone, FiInfo, FiMoreVertical, FiArrowLeft } from 'react-icons/fi';
import { HiOutlineVideoCamera, HiOutlinePhone } from 'react-icons/hi';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { useMediaQuery } from 'react-responsive';
import { toast } from 'react-toastify';

interface ChatHeaderProps {
  userName: string;
  isOnline: boolean;
  lastSeen?: string;
  onBackClick?: () => void;
  showBackButton?: boolean;
}

export default function ChatHeader({ 
  userName, 
  isOnline, 
  lastSeen, 
  onBackClick,
  showBackButton = false 
}: ChatHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const getStatusText = () => {
    if (isOnline) return 'Online';
    if (lastSeen) return `Last seen ${lastSeen}`;
    return 'Offline';
  };

  const getStatusColor = () => {
    return isOnline ? 'bg-green-500' : 'bg-gray-400';
  };

  const handleVideoCall = () => {
    toast.info('📹 Video call feature is coming soon!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
    console.log('Starting video call with', userName);
    // Implement video call logic
  };

  const handleVoiceCall = () => {
    toast.info('📞 Voice call feature is coming soon!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
    console.log('Starting voice call with', userName);
    // Implement voice call logic
  };

  const handleViewProfile = () => {
    toast.info('👤 View profile feature is coming soon!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
    setShowMenu(false);
  };

  const handleBlockUser = () => {
    toast.info('🚫 Block user feature is coming soon!', {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
    setShowMenu(false);
  };

  return (
    <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        {/* Back button for mobile */}
        {showBackButton && isMobile && (
          <button 
            onClick={onBackClick}
            className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
        )}

        {/* User avatar */}
        <div className="relative">
          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
            <span className="text-white font-semibold text-sm sm:text-base">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          {/* Online/Offline status indicator - commented out */}
          {/* <div className={`absolute bottom-0 right-0 h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full ${getStatusColor()} border-2 border-white dark:border-gray-900`}></div> */}
        </div>

        {/* User info */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base md:text-lg">
            {userName}
          </h3>
          {/* Status text - commented out */}
          {/* <div className="flex items-center space-x-2">
            <div className={`h-1.5 w-1.5 rounded-full ${getStatusColor()}`}></div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {getStatusText()}
            </p>
          </div> */}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        {/* Call buttons - hide on very small screens */}
        {!isMobile && (
          <>
            <button
              onClick={handleVoiceCall}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label="Voice call"
            >
              <HiOutlinePhone className="h-5 w-5" />
            </button>
            <button
              onClick={handleVideoCall}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              aria-label="Video call"
            >
              <HiOutlineVideoCamera className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Info button */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            aria-label="More options"
          >
            <FiInfo className="h-5 w-5" />
          </button>

          {/* More options dropdown */}
          {showMenu && (
            <>
              {/* Backdrop overlay */}
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              
              <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-20 min-w-[180px] animate-fade-in">
                <button 
                  onClick={handleViewProfile}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
                >
                  <FiUser className="h-4 w-4 mr-3" />
                  View profile
                </button>
                <button 
                  onClick={handleVoiceCall}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
                >
                  <FiPhone className="h-4 w-4 mr-3" />
                  Voice call
                </button>
                <button 
                  onClick={handleVideoCall}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center transition-colors"
                >
                  <FiVideo className="h-4 w-4 mr-3" />
                  Video call
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button 
                  onClick={handleBlockUser}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
                >
                  Block user
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}