'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [token, setToken] = useState<string | null>(null);

  // Initialize checks
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      setToken(storedToken);
      setIsMobile(window.innerWidth < 768);
    }

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize socket connection
  const initializeSocket = useCallback(() => {
    // 1. Cleanup existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // 2. Check for token
    if (!token && typeof window !== 'undefined') {
      // Try getting from localStorage one more time in case state is stale
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        console.warn('⚠️ No authentication token found, socket will not connect');
        return null;
      }
    }

    // 3. Configure socket
    const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (!authToken) return null;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    // Optimized configuration - reduced reconnection attempts
    const socketConfig = {
      auth: { token: authToken }, // Send token in auth object (standard practice)
      query: {
        token: authToken, // Keep query for backward compatibility
        device: isMobile ? 'mobile' : 'desktop'
      },
      transports: ['websocket'], // Force WebSocket first for performance
      reconnection: true,
      reconnectionDelay: isMobile ? 2000 : 1000, // Longer delay on mobile
      reconnectionDelayMax: isMobile ? 10000 : 5000, // Max delay before giving up
      reconnectionAttempts: isMobile ? 10 : 20, // Reduced attempts to prevent performance issues
      timeout: 10000,
      forceNew: true // Ensure new connection on re-init
    };

    console.log(`🌐 Initializing socket connection to ${API_URL}`);
    const newSocket = io(API_URL, socketConfig);

    return newSocket;
  }, [token, isMobile]);

  // Main Socket Effect
  useEffect(() => {
    // Skip if no token (unless we want to connect as guest, but here we need auth)
    if (!token) return;

    const socket = initializeSocket();
    if (!socket) return;

    socketRef.current = socket;

    // EVENT LISTENERS
    const onConnect = () => {
      console.log('✅ Socket connected successfully');
      setIsConnected(true);
      setReconnectAttempts(0);

      // User online status
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.userId) {
          socket.emit('user-online', payload.userId);
        }
      } catch (e) {
        console.error('Error decoding token for user ID', e);
      }
    };

    const onDisconnect = (reason: any) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected usually due to auth failure
        socket.connect();
      }
    };

    const onConnectError = (err: any) => {
      console.error('⚠️ Socket connection error:', err.message);
      setIsConnected(false);
    };

    const onReconnectAttempt = (attempt: number) => {
      setReconnectAttempts(attempt);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('reconnect_attempt', onReconnectAttempt);

    // CLEANUP
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('reconnect_attempt', onReconnectAttempt);
      socket.disconnect();
    };
  }, [token, initializeSocket]); // Re-run when token changes

  // Manual actions
  const connect = useCallback(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      // Update token state to trigger the effect
      if (storedToken !== token) {
        setToken(storedToken);
      } else if (socketRef.current && !socketRef.current.connected) {
        // Even if token matched, ensure we are connected
        socketRef.current.connect();
      }
    }
  }, [token]);

  const disconnect = useCallback(() => {
    if (socketRef.current) socketRef.current.disconnect();
    setToken(null); // Clear token state to prevent auto-reconnect
  }, []);

  const emitEvent = useCallback((event: string, data?: any) => {
    if (!socketRef.current?.connected) {
      console.warn(`⚠️ Cannot emit ${event}: Socket not connected`);
      return false;
    }
    socketRef.current.emit(event, data);
    return true;
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isMobile,
    reconnectAttempts,
    connect, // Expose connect/refresh
    disconnect,
    emitEvent
  };
}