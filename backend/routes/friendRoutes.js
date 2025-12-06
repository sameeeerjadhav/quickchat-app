const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Send friend request
router.post('/send-request/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const senderId = req.user.id;

    // Check if trying to add self
    if (userId === senderId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    // Check if user exists
    const receiver = await User.findById(userId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get sender
    const sender = await User.findById(senderId);

    // Check if already friends
    const isAlreadyFriend = sender.friends.some(
      friend => friend.user && friend.user.toString() === userId
    );
    
    if (isAlreadyFriend) {
      return res.status(400).json({
        success: false,
        message: 'Already friends'
      });
    }

    // Check if request already exists (pending)
    const existingPendingRequest = receiver.friendRequests.find(
      req => req.from && req.from.toString() === senderId && req.status === 'pending'
    );
    
    if (existingPendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }

    // Check if blocked
    if (receiver.blockedUsers?.some(
      blocked => blocked.user && blocked.user.toString() === senderId
    )) {
      return res.status(403).json({
        success: false,
        message: 'You are blocked by this user'
      });
    }

    // Check if sender blocked receiver
    if (sender.blockedUsers?.some(
      blocked => blocked.user && blocked.user.toString() === userId
    )) {
      return res.status(400).json({
        success: false,
        message: 'You have blocked this user. Unblock first to send request.'
      });
    }

    // Check receiver's privacy settings
    const canSendRequest = checkPrivacySettings(receiver, sender);
    if (!canSendRequest) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send friend request due to privacy settings'
      });
    }

    // Add friend request to receiver
    receiver.friendRequests.push({
      from: senderId,
      status: 'pending'
    });

    await receiver.save();

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    io.to(userId).emit('friend-request-received', {
      from: {
        _id: sender._id,
        name: sender.name,
        email: sender.email,
        profilePic: sender.profilePic
      },
      sentAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Friend request sent successfully'
    });

  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending friend request',
      error: error.message
    });
  }
});

// Accept friend request
router.post('/accept-request/:requestId', protect, async (req, res) => {
  try {
    const { requestId } = req.params;
    const receiverId = req.user.id;

    const receiver = await User.findById(receiverId);
    
    // Find the pending request
    const requestIndex = receiver.friendRequests.findIndex(
      req => req._id.toString() === requestId && req.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found or already processed'
      });
    }

    const request = receiver.friendRequests[requestIndex];
    const senderId = request.from;

    // Update request status
    receiver.friendRequests[requestIndex].status = 'accepted';
    receiver.friendRequests[requestIndex].respondedAt = new Date();

    // Add to friends list for both users
    receiver.friends.push({ user: senderId });
    
    const sender = await User.findById(senderId);
    sender.friends.push({ user: receiverId });

    await Promise.all([receiver.save(), sender.save()]);

    // Emit socket events
    const io = req.app.get('io');
    io.to(receiverId).emit('friend-request-accepted', {
      by: {
        _id: sender._id,
        name: sender.name
      }
    });
    io.to(senderId).emit('friend-request-accepted', {
      by: {
        _id: receiver._id,
        name: receiver.name
      }
    });

    // Also emit friend status update to both users
    io.to(receiverId).emit('friend-status-updated', {
      userId: senderId,
      status: 'friend'
    });
    io.to(senderId).emit('friend-status-updated', {
      userId: receiverId,
      status: 'friend'
    });

    res.json({
      success: true,
      message: 'Friend request accepted'
    });

  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error accepting friend request',
      error: error.message
    });
  }
});

// Reject friend request
router.post('/reject-request/:requestId', protect, async (req, res) => {
  try {
    const { requestId } = req.params;
    const receiverId = req.user.id;

    const receiver = await User.findById(receiverId);
    
    const requestIndex = receiver.friendRequests.findIndex(
      req => req._id.toString() === requestId && req.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    receiver.friendRequests[requestIndex].status = 'rejected';
    receiver.friendRequests[requestIndex].respondedAt = new Date();

    await receiver.save();

    res.json({
      success: true,
      message: 'Friend request rejected'
    });

  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting friend request',
      error: error.message
    });
  }
});

// Cancel sent friend request
router.delete('/cancel-request/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const senderId = req.user.id;

    const receiver = await User.findById(userId);
    
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find and remove the pending request
    const requestIndex = receiver.friendRequests.findIndex(
      req => req.from && req.from.toString() === senderId && req.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'No pending friend request found'
      });
    }

    receiver.friendRequests.splice(requestIndex, 1);
    await receiver.save();

    res.json({
      success: true,
      message: 'Friend request cancelled'
    });

  } catch (error) {
    console.error('Cancel friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling friend request',
      error: error.message
    });
  }
});

// Remove friend
router.delete('/remove/:friendId', protect, async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    const [user, friend] = await Promise.all([
      User.findById(userId),
      User.findById(friendId)
    ]);

    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'Friend not found'
      });
    }

    // Remove from both users' friends list
    user.friends = user.friends.filter(f => 
      f.user && f.user.toString() !== friendId
    );
    friend.friends = friend.friends.filter(f => 
      f.user && f.user.toString() !== userId
    );

    // Remove any pending requests between them
    user.friendRequests = user.friendRequests.filter(
      req => req.from && req.from.toString() !== friendId
    );
    friend.friendRequests = friend.friendRequests.filter(
      req => req.from && req.from.toString() !== userId
    );

    await Promise.all([user.save(), friend.save()]);

    // Emit socket events
    const io = req.app.get('io');
    io.to(userId).emit('friend-removed', { userId: friendId });
    io.to(friendId).emit('friend-removed', { userId });

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing friend',
      error: error.message
    });
  }
});

// Block user
router.post('/block/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);
    
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already blocked
    const isAlreadyBlocked = currentUser.blockedUsers?.some(
      blocked => blocked.user && blocked.user.toString() === userId
    );
    
    if (isAlreadyBlocked) {
      return res.status(400).json({
        success: false,
        message: 'User already blocked'
      });
    }

    // Add to blocked list
    currentUser.blockedUsers.push({ user: userId });
    
    // Remove from friends if exists
    currentUser.friends = currentUser.friends.filter(
      f => f.user && f.user.toString() !== userId
    );
    
    // Remove friend requests
    currentUser.friendRequests = currentUser.friendRequests.filter(
      req => req.from && req.from.toString() !== userId
    );

    // Also remove from target user's friends and requests
    targetUser.friends = targetUser.friends.filter(
      f => f.user && f.user.toString() !== currentUserId
    );
    targetUser.friendRequests = targetUser.friendRequests.filter(
      req => req.from && req.from.toString() !== currentUserId
    );

    await Promise.all([currentUser.save(), targetUser.save()]);

    // Emit socket events
    const io = req.app.get('io');
    io.to(currentUserId).emit('user-blocked', { userId });
    io.to(userId).emit('user-blocked-by', { userId: currentUserId });

    res.json({
      success: true,
      message: 'User blocked successfully'
    });

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking user',
      error: error.message
    });
  }
});

// Unblock user
router.post('/unblock/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    
    // Check if user is blocked
    const blockIndex = currentUser.blockedUsers?.findIndex(
      blocked => blocked.user && blocked.user.toString() === userId
    );
    
    if (blockIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'User is not blocked'
      });
    }

    // Remove from blocked list
    currentUser.blockedUsers.splice(blockIndex, 1);
    await currentUser.save();

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });

  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unblocking user',
      error: error.message
    });
  }
});

// Get blocked users
router.get('/blocked', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId)
      .populate({
        path: 'blockedUsers.user',
        select: 'name email profilePic'
      })
      .select('blockedUsers');

    res.json({
      success: true,
      count: user.blockedUsers?.length || 0,
      data: user.blockedUsers || []
    });

  } catch (error) {
    console.error('Get blocked users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blocked users',
      error: error.message
    });
  }
});

// Get friend requests (incoming)
router.get('/requests', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate({
        path: 'friendRequests.from',
        select: 'name email profilePic'
      })
      .select('friendRequests');

    // Filter to only show pending requests
    const pendingRequests = user.friendRequests.filter(
      req => req.status === 'pending' && req.from
    );

    // Clean the response
    const cleanedRequests = pendingRequests.map(request => {
      const requestObj = request.toObject();
      if (requestObj.from) {
        // Remove sensitive fields
        delete requestObj.from.password;
        delete requestObj.from.__v;
      }
      return requestObj;
    });

    res.json({
      success: true,
      count: cleanedRequests.length,
      data: cleanedRequests
    });

  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching friend requests',
      error: error.message
    });
  }
});

// Get friends list
router.get('/friends', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId)
      .populate({
        path: 'friends.user',
        select: 'name email profilePic isOnline lastSeen'
      })
      .select('friends');

    res.json({
      success: true,
      count: user.friends.length,
      data: user.friends
    });

  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching friends',
      error: error.message
    });
  }
});

// Helper function to check privacy settings
function checkPrivacySettings(receiver, sender) {
  if (!receiver.privacySettings) return true;
  
  const { whoCanAddMe } = receiver.privacySettings;
  
  switch (whoCanAddMe) {
    case 'everyone':
      return true;
    
    case 'friends_of_friends':
      // Check if sender shares any mutual friends with receiver
      const senderFriends = sender.friends.map(f => 
        f.user ? f.user.toString() : f.user
      );
      const receiverFriends = receiver.friends.map(f => 
        f.user ? f.user.toString() : f.user
      );
      
      const hasMutualFriend = senderFriends.some(friendId =>
        receiverFriends.includes(friendId)
      );
      return hasMutualFriend;
    
    case 'nobody':
      return false;
    
    default:
      return true;
  }
}

module.exports = router;