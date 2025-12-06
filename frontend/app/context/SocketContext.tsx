'use client';

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useSocket } from '../hooks/useSocket';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  reconnectAttempts: number;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useSocket();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting' | 'error'>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Monitor connection status changes
  useEffect(() => {
    if (!socket) {
      setConnectionStatus('disconnected');
      return;
    }

    const handleConnect = () => {
      console.log('🟢 Socket connected');
      setConnectionStatus('connected');
      setReconnectAttempts(0);
    };

    const handleDisconnect = () => {
      console.log('🔴 Socket disconnected');
      setConnectionStatus('disconnected');
    };

    const handleConnectError = () => {
      console.log('⚠️ Socket connection error');
      setConnectionStatus('error');
    };

    const handleReconnecting = (attempt: number) => {
      console.log(`🔄 Reconnecting (attempt ${attempt})`);
      setConnectionStatus('connecting');
      setReconnectAttempts(attempt);
    };

    const handleReconnect = () => {
      console.log('✅ Socket reconnected');
      setConnectionStatus('connected');
      setReconnectAttempts(0);
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
      if (document.visibilityState === 'visible' && socket && !socket.connected) {
        console.log('📱 App became visible, checking socket connection...');
        socket.connect();
      }
    };

    // Handle mobile app going to background/foreground
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [socket]);

  // Auto-reconnect less frequently on mobile to save battery
  useEffect(() => {
    if (typeof window === 'undefined' || !socket) return;

    const isMobile = window.innerWidth < 768;
    
    if (isMobile) {
      // On mobile, use less aggressive reconnection for battery saving
      socket.io.opts.reconnectionDelayMax = 10000; // 10 seconds max delay
      socket.io.opts.reconnectionAttempts = 5; // Fewer attempts
    } else {
      // On desktop, more aggressive reconnection
      socket.io.opts.reconnectionDelayMax = 5000; // 5 seconds max delay
      socket.io.opts.reconnectionAttempts = 10; // More attempts
    }
  }, [socket]);

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    reconnectAttempts,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      
      {/* Optional: Connection status indicator for debugging */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 hidden md:block">
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
            connectionStatus === 'connected' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
              : connectionStatus === 'connecting'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
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