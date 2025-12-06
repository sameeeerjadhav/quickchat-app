// server.js - WITH SOCKET.IO
console.log("🚀 QuickChat Backend Starting...");

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// ======================
// CORS CONFIGURATION
// ======================
// Line 17 - Update this:
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://quickchat-app-woad.vercel.app', // ← YOUR ACTUAL URL HERE
  'https://*.vercel.app'
].filter(Boolean);

console.log('🌐 Allowed CORS origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      // Handle wildcard subdomains
      if (allowedOrigin.includes('*')) {
        const regex = new RegExp(allowedOrigin.replace('*', '.*'));
        return regex.test(origin);
      }
      return origin === allowedOrigin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Initialize Socket.io with CORS
const io = socketIO(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');

// ======================
// MIDDLEWARE
// ======================
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// Fix for Render.com health checks
app.use((req, res, next) => {
  if (req.url === '/health' || req.url === '/api/health') {
    return res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date() 
    });
  }
  next();
});

// ======================
// DATABASE CONNECTION
// ======================
const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected!');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

// ======================
// SOCKET.IO SETUP
// ======================
const onlineUsers = new Map(); // userId -> socketId

// Store io instance for use in routes
app.set('io', io);

io.on('connection', (socket) => {
  console.log('\n🔌 New client connected:', socket.id);
  console.log('📊 Current online users:', Array.from(onlineUsers.entries()));

  // User joins their personal room
  socket.on('join-user-room', (userId) => {
    console.log(`🚪 User ${userId} joining room: user-${userId}`);
    socket.join(`user-${userId}`);
  });

  // User goes online
  socket.on('user-online', (userId) => {
    console.log(`👤 USER ONLINE: ${userId} (socket: ${socket.id})`);
    
    // Store user in map
    onlineUsers.set(userId, socket.id);
    
    // User joins their personal room
    socket.join(`user-${userId}`);
    
    console.log('📋 Updated online users map:');
    for (const [uid, sockId] of onlineUsers.entries()) {
      console.log(`   ${uid} -> ${sockId} ${sockId === socket.id ? '⬅️ NEW USER' : ''}`);
    }
    
    // Broadcast to others that user is online
    socket.broadcast.emit('user-status-change', {
      userId,
      isOnline: true
    });
  });

  // Send message with friend verification
  socket.on('send-message', async (messageData) => {
    try {
      const { receiverId, message, senderId } = messageData;
      
      console.log(`📤 Message from ${senderId} to ${receiverId}:`, message.content);
      
      // Verify sender
      const actualSenderId = getUserIdFromSocket(socket.id);
      if (actualSenderId !== senderId) {
        console.log(`❌ Socket ${socket.id} tried to impersonate ${senderId}`);
        socket.emit('error', { message: 'Authentication error' });
        return;
      }
      
      // Check if receiver is online
      const receiverSocketId = onlineUsers.get(receiverId);
      
      if (receiverSocketId) {
        // Send to receiver's room
        io.to(`user-${receiverId}`).emit('receive-message', {
          ...message,
          senderId,
          receiverId,
          timestamp: new Date(),
          isRead: false
        });
        
        // Also send to sender's room for UI update
        io.to(`user-${senderId}`).emit('receive-message', {
          ...message,
          senderId,
          receiverId,
          timestamp: new Date(),
          isRead: true // Sender has seen it
        });
        
        console.log(`📨 Message delivered from ${senderId} to ${receiverId}`);
      } else {
        // Receiver offline - message will be stored in DB
        console.log(`📨 Message stored for offline user ${receiverId}`);
        
        // Still send to sender for optimistic UI
        io.to(`user-${senderId}`).emit('receive-message', {
          ...message,
          senderId,
          receiverId,
          timestamp: new Date(),
          isRead: true
        });
      }
    } catch (error) {
      console.error('Socket send-message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Send file message (optimistic UI update from frontend)
  socket.on('send-file-message', async (messageData) => {
    try {
      const { receiverId, message, senderId } = messageData;
      
      console.log(`📤 FILE MESSAGE (Optimistic) from ${senderId} to ${receiverId}:`, message.fileName);
      
      // Verify sender
      const actualSenderId = getUserIdFromSocket(socket.id);
      if (actualSenderId !== senderId) {
        console.log(`❌ Socket ${socket.id} tried to impersonate ${senderId}`);
        return;
      }
      
      // Send optimistic update to sender only
      io.to(`user-${senderId}`).emit('receive-message', {
        ...message,
        senderId,
        receiverId,
        timestamp: new Date(),
        isRead: true
      });
      
      console.log(`📨 File message optimistic update sent to sender ${senderId}`);
      
    } catch (error) {
      console.error('Socket send-file-message error:', error);
    }
  });

  // Message read receipt
  socket.on('message-read', (data) => {
    const { messageId, readerId, senderId } = data;
    
    console.log(`👁️ Message ${messageId} read by ${readerId}`);
    
    // Notify sender that their message was read
    const senderSocketId = onlineUsers.get(senderId);
    if (senderSocketId) {
      io.to(`user-${senderId}`).emit('message-read', {
        messageId,
        readerId
      });
    }
  });

  // Friend request received (from routes)
  socket.on('friend-request-received', (data) => {
    const { userId, request } = data;
    
    console.log(`🤝 Friend request notification to ${userId}`);
    
    // Send to user's room
    io.to(`user-${userId}`).emit('friend-request-received', request);
  });

  // Friend request accepted (from routes)
  socket.on('friend-request-accepted', (data) => {
    const { userId, friend } = data;
    
    console.log(`✅ Friend request accepted notification to ${userId}`);
    
    // Send to user's room
    io.to(`user-${userId}`).emit('friend-request-accepted', friend);
  });

  // User typing
  socket.on('typing', (data) => {
    const { receiverId, isTyping, senderId } = data;
    
    console.log(`⌨️ Typing event: ${senderId} -> ${receiverId}, typing: ${isTyping}`);
    
    // Verify sender
    const actualSenderId = getUserIdFromSocket(socket.id);
    if (actualSenderId !== senderId) {
      return;
    }
    
    // Get receiver's socket ID
    const receiverSocketId = onlineUsers.get(receiverId);
    
    if (!receiverSocketId) {
      console.log(`❌ Receiver ${receiverId} not found online`);
      return;
    }
    
    console.log(`✅ Sending typing indicator: ${senderId} -> ${receiverId}, typing: ${isTyping}`);
    
    // Send to receiver ONLY via their room
    io.to(`user-${receiverId}`).emit('user-typing', {
      userId: senderId,
      isTyping
    });
  });

  // Friend status updates
  socket.on('friend-status-updated', (data) => {
    const { userId, status } = data;
    
    console.log(`🔄 Friend status update for ${userId}: ${status}`);
    
    // Send to user's room
    io.to(`user-${userId}`).emit('friend-status-updated', { userId, status });
  });

  // User goes offline
  socket.on('disconnect', () => {
    console.log('\n🔌 Client disconnecting:', socket.id);
    
    // Find and remove user from online list
    let foundUser = false;
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`👤 User ${userId} went offline`);
        
        // Leave all rooms
        socket.leaveAll();
        
        // Broadcast to others
        socket.broadcast.emit('user-status-change', {
          userId,
          isOnline: false
        });
        foundUser = true;
        break;
      }
    }
    
    if (!foundUser) {
      console.log('⚠️  Socket was not in onlineUsers map');
    }
    
    console.log('📋 Remaining online users:', Array.from(onlineUsers.entries()));
  });
});

// Helper function to get user ID from socket ID
function getUserIdFromSocket(socketId) {
  for (const [userId, sockId] of onlineUsers.entries()) {
    if (sockId === socketId) {
      return userId;
    }
  }
  return null;
}

// ======================
// ROUTES
// ======================
// Auth routes
app.use('/api/auth', authRoutes);

// Message routes
app.use('/api/messages', messageRoutes);

// User routes
app.use('/api/users', userRoutes);

// Friend routes
app.use('/api/friends', friendRoutes);

// Root
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'QuickChat API with Socket.IO',
    onlineUsers: onlineUsers.size,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      messages: '/api/messages',
      friends: '/api/friends',
      socket: 'WebSocket available'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    onlineUsers: onlineUsers.size,
    uptime: process.uptime()
  });
});

// ======================
// ERROR HANDLING
// ======================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`⚡ Socket.IO ready on port ${PORT}`);
    console.log(`📊 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`🌐 Allowed origins:`, allowedOrigins);
    console.log(`👥 Online users: ${onlineUsers.size}`);
    console.log('='.repeat(50));
  });
};

// Start server
startServer();