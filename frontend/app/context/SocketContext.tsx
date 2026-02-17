'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useSocket } from '../hooks/useSocket';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  reconnectAttempts: number;
  connect: () => void; // New method
  disconnect: () => void; // New method
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected, connect, disconnect, reconnectAttempts } = useSocket();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');

  // Monitor connection status changes
  useEffect(() => {
    if (!socket) {
      setConnectionStatus('disconnected');
      return;
    }

    const handleConnect = () => {
      console.log('🟢 Socket connected');
      setConnectionStatus('connected');
    };

    const handleDisconnect = () => {
      console.log('🔴 Socket disconnected');
      setConnectionStatus('disconnected');
    };

    const handleConnectError = () => {
      console.log('⚠️ Socket connection error');
      setConnectionStatus('error');
    };

    const handleReconnecting = () => {
      console.log('🔄 Reconnecting...');
      setConnectionStatus('connecting');
    };

    const handleReconnect = () => {
      console.log('✅ Socket reconnected');
      setConnectionStatus('connected');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('reconnecting', handleReconnecting);
    socket.on('reconnect', handleReconnect);

    // Set initial status
    if (socket.connected) {
      setConnectionStatus('connected');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('reconnecting', handleReconnecting);
      socket.off('reconnect', handleReconnect);
    };
  }, [socket]);

  // Handle mobile app state changes (optional - for PWA)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Use exposed connect method to ensure check
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [connect]);

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    connect,
    disconnect
  };

  return (
    <SocketContext.Provider value={value}>
      {children}

      {/* Optional: Connection status indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 hidden md:block">
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium border ${connectionStatus === 'connected'
              ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
              : connectionStatus === 'connecting'
                ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
            }`}>
            Socket: {connectionStatus}
            {reconnectAttempts > 0 && ` (${reconnectAttempts})`}
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}
