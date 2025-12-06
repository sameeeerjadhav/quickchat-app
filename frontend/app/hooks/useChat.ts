'use client';

import { useState, useEffect } from 'react';
import { authAPI } from '../../lib/api';

export function useChat() {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authAPI.getProfile();
        
        let userId = '';
        
        if (response.data) {
          if (response.data.user && response.data.user._id) {
            userId = response.data.user._id;
          } else if (response.data._id) {
            userId = response.data._id;
          } else if (response.data.id) {
            userId = response.data.id;
          }
        }
        
        if (userId) {
          setCurrentUserId(userId);
        } else {
          // Try JWT
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              const jwtUserId = payload.userId || payload._id || payload.id;
              if (jwtUserId) setCurrentUserId(jwtUserId);
            } catch (jwtErr) {
              console.error('JWT decode error:', jwtErr);
            }
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Auth check failed:', err);
        localStorage.removeItem('token');
        setLoading(false);
        throw err;
      }
    };

    checkAuth();
  }, []);

  return { currentUserId, loading, isMobile };
}