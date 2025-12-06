'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePollingOptions {
  enabled?: boolean;
  immediate?: boolean;
  onError?: (error: any) => void;
  maxRetries?: number;
  retryDelay?: number;
}

export function usePolling(
  callback: () => Promise<void> | void, 
  interval: number = 3000,
  options: UsePollingOptions = {}
) {
  const {
    enabled = true,
    immediate = true,
    onError,
    maxRetries = 3,
    retryDelay = 5000
  } = options;

  const savedCallback = useRef<() => Promise<void> | void>();
  const intervalId = useRef<NodeJS.Timeout>();
  const retryCount = useRef(0);
  const [isPolling, setIsPolling] = useState(false);
  const [lastPollTime, setLastPollTime] = useState<number | null>(null);
  const [error, setError] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile for optimization
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Adaptive interval based on device and network conditions
  const getAdaptiveInterval = useCallback(() => {
    let adaptiveInterval = interval;
    
    // Longer intervals on mobile to save battery
    if (isMobile) {
      adaptiveInterval = Math.max(interval, 5000); // Minimum 5 seconds on mobile
    }
    
    // If we have errors, increase interval for retries
    if (retryCount.current > 0) {
      adaptiveInterval = retryDelay; // Use retry delay for error retries
    }
    
    // If app is in background (mobile), increase interval more
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      adaptiveInterval *= 2; // Double interval when app is in background
    }
    
    return adaptiveInterval;
  }, [interval, isMobile, retryDelay]);

  // Save callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Polling function with error handling
  const executePoll = useCallback(async () => {
    if (!enabled || !savedCallback.current) return;

    try {
      setIsPolling(true);
      setError(null);
      await savedCallback.current();
      retryCount.current = 0; // Reset retry count on success
      setLastPollTime(Date.now());
    } catch (err) {
      console.error('Polling error:', err);
      setError(err);
      onError?.(err);
      
      // Exponential backoff for retries
      retryCount.current += 1;
      if (retryCount.current < maxRetries) {
        console.log(`Retrying in ${retryDelay}ms (attempt ${retryCount.current}/${maxRetries})`);
      } else {
        console.error(`Max retries reached (${maxRetries})`);
        // Stop polling after max retries
        if (intervalId.current) {
          clearInterval(intervalId.current);
        }
      }
    } finally {
      setIsPolling(false);
    }
  }, [enabled, onError, maxRetries, retryDelay]);

  // Setup polling interval
  useEffect(() => {
    if (!enabled) {
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = undefined;
      }
      return;
    }

    const startPolling = () => {
      const adaptiveInterval = getAdaptiveInterval();
      
      // Clear existing interval
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
      
      // Start new interval with adaptive timing
      intervalId.current = setInterval(executePoll, adaptiveInterval);
      
      // Immediate execution if requested
      if (immediate) {
        executePoll();
      }
    };

    startPolling();

    // Handle app visibility changes (mobile optimization)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // App became visible, restart polling with normal interval
        startPolling();
      } else if (document.visibilityState === 'hidden') {
        // App went to background, clear interval (it will restart with longer interval)
        if (intervalId.current) {
          clearInterval(intervalId.current);
        }
        // Restart with longer interval for background
        const backgroundInterval = getAdaptiveInterval();
        intervalId.current = setInterval(executePoll, backgroundInterval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle network online/offline events
    const handleOnline = () => {
      console.log('📶 Network online, resuming polling');
      retryCount.current = 0; // Reset retry count when network comes back
      startPolling();
    };

    const handleOffline = () => {
      console.log('📶 Network offline, pausing polling');
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = undefined;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, executePoll, getAdaptiveInterval, immediate]);

  // Manual control functions
  const stopPolling = useCallback(() => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = undefined;
      setIsPolling(false);
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!enabled || intervalId.current) return;
    
    const adaptiveInterval = getAdaptiveInterval();
    intervalId.current = setInterval(executePoll, adaptiveInterval);
    
    if (immediate) {
      executePoll();
    }
  }, [enabled, executePoll, getAdaptiveInterval, immediate]);

  const triggerPoll = useCallback(() => {
    return executePoll();
  }, [executePoll]);

  return {
    isPolling,
    error,
    lastPollTime,
    retryCount: retryCount.current,
    isMobile,
    stopPolling,
    startPolling,
    triggerPoll,
  };
}