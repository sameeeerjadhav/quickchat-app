export interface Message {
  _id: string;
  sender: User | string;
  receiver: User | string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  fileUrl?: string;        // Add this
  fileType?: string;       // Add this
  fileName?: string;
  fileSize?: number;      // Add this
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  updatedAt: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date | string;
}

export interface FriendRequest {
  _id: string;
  from: User;
  to: User | string;
  status: 'pending' | 'accepted' | 'rejected';
  sentAt: string;
  respondedAt?: string;
}

export interface Friend {
  _id: string;
  user: User;
  friendOf: User | string;
  addedAt: string;
}

export interface BlockedUser {
  _id: string;
  user: User;
  blockedBy: User | string;
  blockedAt: string;
}

// Extend User interface with friend-related fields
export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: Date | string;
  friendRequests?: FriendRequest[];
  friends?: Friend[];
  blockedUsers?: BlockedUser[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}