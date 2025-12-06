const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  searchUsers,
  getUserById,
  updateProfile,
  getAllUsers
} = require('../controllers/userController');

// All routes require authentication
router.use(protect);

// Search users
router.get('/search', searchUsers);

// Get all users (except current)
router.get('/all', getAllUsers);

// Get user by ID
router.get('/:userId', getUserById);

// Update profile
router.put('/profile', updateProfile);

module.exports = router;