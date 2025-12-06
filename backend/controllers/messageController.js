const Message = require('../models/Message');
const User = require('../models/User');
const mongoose = require('mongoose');

// Send a message (with friend verification)
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, image } = req.body;
    const senderId = req.user.id;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Check if users are friends
    const sender = await User.findById(senderId);
    const isFriend = sender.friends.some(
      friend => friend.user && friend.user.toString() === receiverId
    );

    if (!isFriend) {
      return res.status(403).json({
        success: false,
        message: 'You must be friends to message this user'
      });
    }

    // Check if blocked
    const isBlocked = sender.blockedUsers?.some(
      blocked => blocked.user && blocked.user.toString() === receiverId
    );
    
    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'You have blocked this user'
      });
    }

    // Check if blocked by receiver
    const isBlockedByReceiver = receiver.blockedUsers?.some(
      blocked => blocked.user && blocked.user.toString() === senderId
    );
    
    if (isBlockedByReceiver) {
      return res.status(403).json({
        success: false,
        message: 'This user has blocked you'
      });
    }

    // Create message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      image
    });

    // Populate sender info
    await message.populate('sender', 'name email profilePic');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// Get chat between two users (with friend verification)
exports.getChat = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Check if users are friends
    const currentUser = await User.findById(currentUserId);
    const isFriend = currentUser.friends.some(
      friend => friend.user && friend.user.toString() === userId
    );
    
    if (!isFriend) {
      return res.status(403).json({
        success: false,
        message: 'You must be friends to view chat history'
      });
    }

    // Get messages between two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'name profilePic')
    .populate('receiver', 'name profilePic');

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });

  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching chat',
      error: error.message
    });
  }
};

// Get all conversations for current user (only with friends)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user with friends
    const currentUser = await User.findById(userId);
    const friendIds = currentUser.friends.map(friend => friend.user);

    // Get distinct users you've chatted with (only friends)
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: mongoose.Types.ObjectId(userId), receiver: { $in: friendIds } },
            { receiver: mongoose.Types.ObjectId(userId), sender: { $in: friendIds } }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', mongoose.Types.ObjectId(userId)] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiver', mongoose.Types.ObjectId(userId)] },
                    { $eq: ['$isRead', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          'user.password': 0,
          'user.__v': 0
        }
      }
    ]);

    res.json({
      success: true,
      count: conversations.length,
      data: conversations
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;

    await Message.updateMany(
      { _id: { $in: messageIds }, receiver: req.user.id },
      { isRead: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: error.message
    });
  }
};