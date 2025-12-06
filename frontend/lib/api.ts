import axios from 'axios';
import { User } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    console.log('🔑 API Request Interceptor - Token exists:', !!token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Authorization header added');
    }
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data
    });
    
    if (error.response?.status === 401) {
      // Clear token if unauthorized
      if (typeof window !== 'undefined') {
        console.log('🚫 Unauthorized - clearing token');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  
  getProfile: () => {
    console.log('👤 Fetching user profile...');
    return api.get('/api/auth/me');
  },
  
  logout: () => api.post('/api/auth/logout'),
};

// User APIs
export const userAPI = {
  search: (query: string) => 
    api.get(`/api/users/search?query=${query}`),
  
  getAll: () => {
    console.log('👥 Fetching all users...');
    return api.get('/api/users/all');
  },
  
  getById: (id: string) => api.get(`/api/users/${id}`),
  
  updateProfile: (data: Partial<User>) => 
    api.put('/api/users/profile', data),
};

// Friend APIs
export const friendAPI = {
  sendRequest: (userId: string) => {
    console.log(`📤 Sending friend request to ${userId}`);
    return api.post(`/api/friends/send-request/${userId}`);
  },
  
  acceptRequest: (requestId: string) => {
    console.log(`✅ Accepting friend request ${requestId}`);
    return api.post(`/api/friends/accept-request/${requestId}`);
  },
  
  rejectRequest: (requestId: string) => {
    console.log(`❌ Rejecting friend request ${requestId}`);
    return api.post(`/api/friends/reject-request/${requestId}`);
  },
  
  cancelRequest: (userId: string) => {
    console.log(`🚫 Cancelling request to ${userId}`);
    return api.delete(`/api/friends/cancel-request/${userId}`);
  },
  
  getRequests: () => {
    console.log('📋 Fetching friend requests...');
    return api.get('/api/friends/requests');
  },
  
  getFriends: () => {
    console.log('👫 Fetching friends...');
    return api.get('/api/friends/friends');
  },
  
  removeFriend: (friendId: string) => {
    console.log(`👋 Removing friend ${friendId}`);
    return api.delete(`/api/friends/remove/${friendId}`);
  },
  
  blockUser: (userId: string) => {
    console.log(`🚷 Blocking user ${userId}`);
    return api.post(`/api/friends/block/${userId}`);
  },
  
  unblockUser: (userId: string) => {
    console.log(`✅ Unblocking user ${userId}`);
    return api.post(`/api/friends/unblock/${userId}`);
  },
  
  getBlockedUsers: () => {
    console.log('🚫 Fetching blocked users...');
    return api.get('/api/friends/blocked');
  },
  
  // Debug endpoints
  debugRequests: () => api.get('/api/friends/debug-requests'),
  debugAuth: () => api.get('/api/friends/debug-auth'),
};

// Message APIs
export const messageAPI = {
  send: (data: { receiverId: string; content: string }) => {
    console.log(`📝 Sending message to ${data.receiverId}`);
    return api.post('/api/messages/send', data);
  },
  
  getChat: (userId: string) => {
    console.log(`💬 Fetching chat with ${userId}`);
    return api.get(`/api/messages/chat/${userId}`);
  },
  
  getConversations: () => {
    console.log('📱 Fetching conversations...');
    return api.get('/api/messages/conversations');
  },
  
  markAsRead: (messageId: string) =>
    api.put('/api/messages/read', { messageId }),
};

export default api;