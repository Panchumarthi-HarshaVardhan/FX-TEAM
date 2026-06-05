const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUser, 
  followUser, 
  togglePinPost, 
  getBookmarks, 
  getUserByUsername,
  recordProfileView,
  getProfileViews,
  updateProfile,
  uploadAvatar,
  uploadCover,
  searchUsers,
  getFounderScore,
  getFollowers,
  getFollowing,
  getMutualConnections,
  blockUser,
  unblockUser,
  setupJobSeekerProfile,
  setupFounderProfile,
  setupInvestorProfile,
  changePassword
} = require('../controllers/userController');
const { protect, optionalProtect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { followLimiter } = require('../middleware/rateLimiters');

router.get('/score', protect, getFounderScore);
router.get('/me', protect, require('../controllers/authController').getMe);
router.put('/update', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/upload-avatar', protect, upload.single('image'), uploadAvatar);
router.post('/upload-cover', protect, upload.single('image'), uploadCover);
router.get('/search', optionalProtect, searchUsers);
router.get('/bookmarks', protect, getBookmarks);
router.get('/profile-views', protect, getProfileViews);
router.get('/handle/:username', optionalProtect, getUserByUsername); // Legacy support
router.get('/:id/followers', optionalProtect, getFollowers);
router.get('/:id/following', optionalProtect, getFollowing);
router.get('/:id/mutuals', protect, getMutualConnections);
router.route('/:id([0-9a-fA-F]{24})').get(optionalProtect, getUser); // ID check first
router.get('/:username', optionalProtect, getUserByUsername); // Fallback to username
router.route('/').get(optionalProtect, getUsers);
router.route('/pin/:postId').put(protect, togglePinPost);
router.route('/:id/follow').post(protect, followLimiter, followUser);
router.route('/:id/view').post(protect, recordProfileView);
router.post('/block/:id', protect, blockUser);
router.post('/unblock/:id', protect, unblockUser);

// Profile Setup Routes
router.post('/profile/job-seeker', protect, setupJobSeekerProfile);
router.post('/job-seeker', protect, setupJobSeekerProfile);
router.post('/profile/user', protect, setupJobSeekerProfile);
router.post('/user', protect, setupJobSeekerProfile);
router.post('/profile/founder', protect, setupFounderProfile);
router.post('/founder', protect, setupFounderProfile);
router.post('/profile/investor', protect, setupInvestorProfile);
router.post('/investor', protect, setupInvestorProfile);

module.exports = router;
