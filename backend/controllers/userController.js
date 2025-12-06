const User = require('../models/User');
const mongoose = require('mongoose');

// Search users by name or email (with friend status)
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

    if (!query || query.trim() === '') {
      return res.json({
        success: true,
        data: [],
        message: 'Please enter a search term'
      });
    }

    // Get current user with friend relationships
    const currentUser = await User.findById(currentUserId)
      .populate({
        path: 'friends.user',
        select: '_id'
      })
      .populate({
        path: 'friendRequests.from',
        select: '_id'
      });

    // Get users matching search
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, // Exclude current user
        {
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    }).select('name email profilePic bio isOnline lastSeen');

    // Add friend status to each user
    const usersWithStatus = users.map(user => {
      const userObj = user.toObject();
      
      // Remove sensitive fields
      delete userObj.password;
      delete userObj.__v;
      
      // Check if already friends
      const isFriend = currentUser.friends.some(
        friend => friend.user && friend.user._id.toString() === user._id.toString()
      );
      
      // Check if friend request sent (pending)
      const sentRequest = currentUser.friendRequests.some(
        req => req.from && req.from._id.toString() === user._id.toString() && req.status === 'pending'
      );
      
      // Check if received friend request
      const receivedRequest = user.friendRequests?.some(
        req => req.from && req.from.toString() === currentUserId && req.status === 'pending'
      );
      
      // Check if blocked
      const isBlocked = currentUser.blockedUsers?.some(
        blocked => blocked.user && blocked.user.toString() === user._id.toString()
      );

      return {
        ...userObj,
        friendStatus: isFriend ? 'friend' : 
                     sentRequest ? 'request_sent' : 
                     receivedRequest ? 'request_received' : 
                     isBlocked ? 'blocked' : 'none'
      };
    });

    res.json({
      success: true,
      count: usersWithStatus.length,
      data: usersWithStatus
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
};

// Get user by ID with friend status
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    // Get current user with friend relationships
    const currentUser = await User.findById(currentUserId)
      .populate({
        path: 'friends.user',
        select: '_id name email profilePic'
      })
      .populate({
        path: 'friendRequests.from',
        select: '_id name email profilePic'
      });

    const user = await User.findById(userId).select('name email profilePic bio isOnline lastSeen');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove sensitive fields
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;

    // Check friend status
    const isFriend = currentUser.friends.some(
      friend => friend.user && friend.user._id.toString() === userId
    );
    
    const sentRequest = currentUser.friendRequests.some(
      req => req.from && req.from._id.toString() === userId && req.status === 'pending'
    );
    
    const receivedRequest = user.friendRequests?.some(
      req => req.from && req.from.toString() === currentUserId && req.status === 'pending'
    );
    
    const isBlocked = currentUser.blockedUsers?.some(
      blocked => blocked.user && blocked.user.toString() === userId
    );

    const userWithStatus = {
      ...userObj,
      friendStatus: isFriend ? 'friend' : 
                   sentRequest ? 'request_sent' : 
                   receivedRequest ? 'request_received' : 
                   isBlocked ? 'blocked' : 'none',
      canMessage: isFriend && !isBlocked
    };

    res.json({
      success: true,
      data: userWithStatus
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, privacySettings } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (privacySettings) updateData.privacySettings = privacySettings;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('name email profilePic bio isOnline lastSeen');

    // Remove sensitive fields
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.__v;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: userObj
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Get all users with friend status
exports.getAllUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Get current user with friend relationships
    const currentUser = await User.findById(currentUserId)
      .populate({
        path: 'friends.user',
        select: '_id'
      })
      .populate({
        path: 'friendRequests.from',
        select: '_id'
      });

    // Get all users except current
    const users = await User.find({
      _id: { $ne: currentUserId }
    }).select('name email profilePic bio isOnline lastSeen');

    // Add friend status to each user
    const usersWithStatus = users.map(user => {
      const userObj = user.toObject();
      
      // Remove sensitive fields
      delete userObj.password;
      delete userObj.__v;
      
      // Check if already friends
      const isFriend = currentUser.friends.some(
        friend => friend.user && friend.user._id.toString() === user._id.toString()
      );
      
      // Check if friend request sent
      const sentRequest = currentUser.friendRequests.some(
        req => req.from && req.from._id.toString() === user._id.toString() && req.status === 'pending'
      );
      
      // Check if received friend request
      const receivedRequest = user.friendRequests?.some(
        req => req.from && req.from.toString() === currentUserId && req.status === 'pending'
      );
      
      // Check if blocked
      const isBlocked = currentUser.blockedUsers?.some(
        blocked => blocked.user && blocked.user.toString() === user._id.toString()
      );

      return {
        ...userObj,
        friendStatus: isFriend ? 'friend' : 
                     sentRequest ? 'request_sent' : 
                     receivedRequest ? 'request_received' : 
                     isBlocked ? 'blocked' : 'none',
        canMessage: isFriend && !isBlocked
      };
    });

    // Separate users into categories
    const friends = usersWithStatus.filter(u => u.friendStatus === 'friend');
    const pendingRequests = usersWithStatus.filter(u => u.friendStatus === 'request_sent');
    const receivedRequests = usersWithStatus.filter(u => u.friendStatus === 'request_received');
    const blockedUsers = usersWithStatus.filter(u => u.friendStatus === 'blocked');
    const otherUsers = usersWithStatus.filter(u => u.friendStatus === 'none');

    res.json({
      success: true,
      count: usersWithStatus.length,
      data: {
        all: usersWithStatus,
        friends,
        pendingRequests,
        receivedRequests,
        blockedUsers,
        otherUsers
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Get friends list only
exports.getFriends = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId)
      .populate({
        path: 'friends.user',
        select: 'name email profilePic bio isOnline lastSeen'
      })
      .select('friends');

    // Remove sensitive fields from populated friends
    const friends = user.friends.map(friend => {
      const friendObj = friend.toObject();
      if (friendObj.user) {
        delete friendObj.user.password;
        delete friendObj.user.__v;
      }
      return friendObj;
    });

    res.json({
      success: true,
      count: friends.length,
      data: friends
    });

  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching friends',
      error: error.message
    });
  }
};

// Get friend requests
exports.getFriendRequests = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const user = await User.findById(currentUserId)
      .populate({
        path: 'friendRequests.from',
        select: 'name email profilePic'
      })
      .select('friendRequests');

    // Filter to only show pending requests
    const pendingRequests = user.friendRequests.filter(
      req => req.status === 'pending' && req.from
    );

    // Remove sensitive fields from populated requests
    const cleanedRequests = pendingRequests.map(request => {
      const requestObj = request.toObject();
      if (requestObj.from) {
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
};

// Check if users can message each other
exports.canMessageUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if friends
    const isFriend = currentUser.friends.some(
      friend => friend.user && friend.user.toString() === userId
    );

    // Check if blocked
    const isBlocked = currentUser.blockedUsers?.some(
      blocked => blocked.user && blocked.user.toString() === userId
    );

    // Check if target user blocked current user
    const isBlockedByUser = targetUser.blockedUsers?.some(
      blocked => blocked.user && blocked.user.toString() === currentUserId
    );

    const canMessage = isFriend && !isBlocked && !isBlockedByUser;

    res.json({
      success: true,
      canMessage,
      reasons: !canMessage ? [
        !isFriend && 'Not friends',
        isBlocked && 'You blocked this user',
        isBlockedByUser && 'User blocked you'
      ].filter(Boolean) : []
    });

  } catch (error) {
    console.error('Can message check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking messaging permission',
      error: error.message
    });
  }
};

// Get user suggestions (non-friends, not blocked, no pending requests)
exports.getUserSuggestions = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const currentUser = await User.findById(currentUserId)
      .populate({
        path: 'friends.user',
        select: '_id'
      })
      .populate({
        path: 'friendRequests.from',
        select: '_id'
      });

    // Get all users except current
    const allUsers = await User.find({
      _id: { $ne: currentUserId }
    }).select('name email profilePic bio isOnline lastSeen');

    // Filter users who are not friends, not blocked, and no pending requests
    const suggestions = allUsers.filter(user => {
      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.__v;
      
      const isFriend = currentUser.friends.some(
        friend => friend.user && friend.user._id.toString() === user._id.toString()
      );
      
      const hasPendingRequest = currentUser.friendRequests.some(
        req => req.from && req.from._id.toString() === user._id.toString() && req.status === 'pending'
      );
      
      const isBlocked = currentUser.blockedUsers?.some(
        blocked => blocked.user && blocked.user.toString() === user._id.toString()
      );

      return !isFriend && !hasPendingRequest && !isBlocked;
    }).slice(0, 10); // Limit to 10 suggestions

    // Remove sensitive fields
    const cleanedSuggestions = suggestions.map(user => {
      const userObj = user.toObject();
      delete userObj.password;
      delete userObj.__v;
      return userObj;
    });

    res.json({
      success: true,
      count: cleanedSuggestions.length,
      data: cleanedSuggestions
    });

  } catch (error) {
    console.error('Get user suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user suggestions',
      error: error.message
    });
  }
};