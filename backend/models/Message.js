const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String
  },
  // Media/File fields
  fileUrl: {
    type: String
  },
  fileType: {
    type: String,
    enum: ['image', 'video', 'audio', 'file', null]
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  duration: {
    type: Number  // For voice messages - duration in seconds
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Create index for faster queries
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;