'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Check if mobile for optimization
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Update socket config if socket exists and device changed
      if (socketRef.current) {
        updateSocketConfig(socketRef.current, mobile);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update socket configuration based on device
  const updateSocketConfig = useCallback((socket: Socket, mobile: boolean) => {
    // Different configuration for mobile vs desktop
    const config = {
      reconnectionDelayMax: mobile ? 10000 : 5000, // 10s max on mobile, 5s on desktop
      reconnectionAttempts: mobile ? 5 : 10, // Fewer attempts on mobile
      timeout: mobile ? 20000 : 10000, // Longer timeout on mobile
    };
    
    // Update socket options
    socket.io.opts.reconnectionDelayMax = config.reconnectionDelayMax;
    socket.io.opts.timeout = config.timeout;
    
    // Note: reconnectionAttempts might need socket recreation
  }, []);

  // Get authentication token
  const getAuthToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }, []);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    const token = getAuthToken();
    
    if (!token) {
      console.warn('⚠️ No authentication token found');
      return null;
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    
    const socketConfig = {
      withCredentials: true,
      transports: ['websocket', 'polling'], // Fallback to polling
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: isMobile ? 10000 : 5000,
      reconnectionAttempts: isMobile ? 5 : 10,
      timeout: isMobile ? 20000 : 10000,
      query: {
        token: token,
        device: isMobile ? 'mobile' : 'desktop'
      }
    };

    console.log(`🌐 Creating socket connection (${isMobile ? 'mobile' : 'desktop'} mode)`);
    return io(API_URL, socketConfig);
  }, [isMobile, getAuthToken]);

  useEffect(() => {
    const socket = initializeSocket();
    if (!socket) return;

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket.io connected');
      setIsConnected(true);
      setReconnectAttempts(0);
      
      // Emit user info if needed
      const token = getAuthToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.userId) {
            socket.emit('user-online', payload.userId);
          }
        } catch (err) {
          console.error('Failed to parse token:', err);
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      setIsConnected(false);
      
      // Don't show error for normal disconnects
      if (reason !== 'io client disconnect') {
        console.log('🔄 Will attempt to reconnect...');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('⚠️ Socket connection error:', error.message);
      setIsConnected(false);
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnect attempt ${attempt}`);
      setReconnectAttempts(attempt);
    });

    socket.on('reconnect', () => {
      console.log('✅ Socket reconnected successfully');
      setIsConnected(true);
      setReconnectAttempts(0);
    });

    socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
      setIsConnected(false);
    });

    // Handle mobile app visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !socket.connected) {
        console.log('📱 App became visible, reconnecting socket...');
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket connection');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [initializeSocket, getAuthToken]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔄 Manually reconnecting socket...');
      socketRef.current.connect();
    }
  }, []);

  // Manual disconnect function
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Manually disconnecting socket...');
      socketRef.current.disconnect();
    }
  }, []);

  // Send event helper
  const emitEvent = useCallback((event: string, data?: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    console.warn(`⚠️ Cannot emit ${event}: Socket not connected`);
    return false;
  }, []);

  return { 
    socket: socketRef.current, 
    isConnected,
    isMobile,
    reconnectAttempts,
    reconnect,
    disconnect,
    emitEvent
  };
}