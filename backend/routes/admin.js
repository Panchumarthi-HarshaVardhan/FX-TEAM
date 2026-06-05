const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getAdminStats,
  getUsers,
  toggleUserBlock,
  verifyUser,
  deleteUser,
  getStartups,
  verifyStartup,
  editStartup,
  deleteStartup,
  getInvestors,
  verifyInvestor,
  getApplications,
  updateApplicationStatus,
  getPosts,
  deletePost,
  getReports,
  updateReportStatus,
  getAnalytics,
  getSettings,
  updateSettings
} = require('../controllers/adminController');

const {
  getSpecializedVerifications,
  updateSpecializedVerificationStatus
} = require('../controllers/verificationController');

// All administrative routes are locked behind JWT authentication and administrative role check
router.use(protect);
router.use(authorize('admin'));

// Overview Stats
router.get('/stats', getAdminStats);

// User Directory Controls
router.get('/users', getUsers);
router.put('/users/:id/block', toggleUserBlock);
router.put('/users/:id/verify', verifyUser);
router.delete('/users/:id', deleteUser);

// Startup Directory Controls
router.get('/startups', getStartups);
router.put('/startups/:id/verify', verifyStartup);
router.put('/startups/:id', editStartup);
router.delete('/startups/:id', deleteStartup);

// Verification Centers
router.get('/verifications/specialized', getSpecializedVerifications);
router.put('/verifications/specialized/:id', updateSpecializedVerificationStatus);

// Investor Profiles
router.get('/investors', getInvestors);
router.put('/investors/:id/verify', verifyInvestor);

// Recruitment Applications Sourcing
router.get('/applications', getApplications);
router.put('/applications/:id/status', updateApplicationStatus);

// Post Moderation
router.get('/posts', getPosts);
router.delete('/posts/:id', deletePost);

// Incident Flags Reports Queue
router.get('/reports', getReports);
router.put('/reports/:id/status', updateReportStatus);

// Aggregated Network Analytics
router.get('/analytics', getAnalytics);

// Global Platform Configuration Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

module.exports = router;
