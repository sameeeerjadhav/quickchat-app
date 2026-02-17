const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendMessage,
  getChat,
  getConversations,
  markAsRead
} = require('../controllers/messageController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now
    cb(null, true);
  }
});

// All routes require authentication
router.use(protect);

// Send a message
router.post('/send', sendMessage);

// Get chat with specific user
router.get('/chat/:userId', getChat);

// Get all conversations
router.get('/conversations', getConversations);

// Mark messages as read
router.put('/read', markAsRead);

// Send file
router.post('/send-file', upload.single('file'), async (req, res) => {
  try {
    const { receiverId, senderId, fileType, text, duration } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📁 File uploaded:', {
      fileName: file.originalname,
      fileType: fileType,
      size: file.size,
      mimetype: file.mimetype,
      duration: duration
    });

    // Determine file type from mimetype if not provided
    let finalFileType = fileType;
    if (!finalFileType && file.mimetype) {
      if (file.mimetype.startsWith('image/')) {
        finalFileType = 'image';
      } else if (file.mimetype.startsWith('video/')) {
        finalFileType = 'video';
      } else if (file.mimetype.startsWith('audio/')) {
        finalFileType = 'audio';
      } else {
        finalFileType = 'file';
      }
    }

    // Create message with file URL
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content: text || `📎 ${file.originalname}`,
      fileUrl: `/uploads/${file.filename}`,
      fileType: finalFileType,
      fileName: file.originalname,
      fileSize: file.size,
      duration: duration ? parseInt(duration) : undefined
    });

    console.log('💾 Message saved to database:', {
      _id: message._id,
      fileUrl: message.fileUrl,
      fileType: message.fileType,
      fileName: message.fileName
    });

    // Emit via socket to specific rooms
    const io = req.app.get('io');

    // Build the message object for socket emission
    const socketMessage = {
      _id: message._id,
      senderId,
      receiverId,
      content: message.content,
      fileUrl: message.fileUrl,
      fileType: message.fileType,
      fileName: message.fileName,
      fileSize: message.fileSize,
      duration: message.duration,
      createdAt: message.createdAt
    };

    // Emit to receiver's room
    io.to(`user-${receiverId}`).emit('receive-message', {
      ...socketMessage,
      isRead: false
    });

    // Emit to sender's room
    io.to(`user-${senderId}`).emit('receive-message', {
      ...socketMessage,
      isRead: true  // Sender has already seen it
    });

    console.log('📡 File message emitted via socket:', {
      toReceiver: receiverId,
      toSender: senderId,
      fileName: message.fileName
    });

    res.json({
      success: true,
      message: socketMessage
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;