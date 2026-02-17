'use client';

import { useState, useEffect } from 'react';

interface TypingIndicatorProps {
  userName?: string;
  isMobile?: boolean;
  showAvatar?: boolean;
}

export default function TypingIndicator({ 
  userName, 
  isMobile = false,
  showAvatar = false 
}: TypingIndicatorProps) {
  const [activeDot, setActiveDot] = useState(0);

  // Animation for dots
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDot((prev) => (prev + 1) % 3);
    }, 400);

    return () => clearInterval(interval);
  }, []);

  const getDotClass = (index: number) => {
    const baseClass = `rounded-full ${isMobile ? 'h-1.5 w-1.5' : 'h-2 w-2'} transition-all duration-300`;
    const isActive = index === activeDot;
    
    return `${baseClass} ${
      isActive 
        ? 'bg-blue-500 dark:bg-blue-400 scale-125' 
        : 'bg-gray-400 dark:bg-zinc-600'
    }`;
  };

  return (
    <div className={`flex items-center ${
      isMobile ? 'gap-1.5 px-3 py-1.5' : 'gap-2 px-4 py-2'
    } animate-pulse`}>
      {showAvatar && (
        <div className={`rounded-full bg-gray-200 dark:bg-zinc-800 ${
          isMobile ? 'h-6 w-6' : 'h-8 w-8'
        } flex-shrink-0`}></div>
      )}
      
      {/* Message bubble container */}
      <div className={`flex items-center ${
        isMobile ? 'gap-1.5 px-3 py-2' : 'gap-2 px-4 py-2.5'
      } bg-gray-100 dark:bg-zinc-900 rounded-2xl rounded-tl-sm`}>
        {/* Animated dots */}
        <div className="flex items-center gap-1">
          <div className={getDotClass(0)}></div>
          <div className={getDotClass(1)}></div>
          <div className={getDotClass(2)}></div>
        </div>
        
        {/* Text label */}
        <span className={`${
          isMobile ? 'text-xs' : 'text-sm'
        } text-gray-600 dark:text-gray-400 font-medium ml-1.5 whitespace-nowrap`}>
          {userName ? (
            <span>
              <span className="font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[80px] sm:max-w-[120px] inline-block align-middle">
                {userName}
              </span>
              <span className="ml-1">is typing...</span>
            </span>
          ) : (
            'typing...'
          )}
        </span>
      </div>

      {/* CSS for custom animation */}
      <style jsx>{`
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .animate-pulse {
          animation: pulse-subtle 2s infinite;
        }
      `}</style>
    </div>
  );
}
