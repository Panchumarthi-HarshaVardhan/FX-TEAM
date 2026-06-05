const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateAccount,
  updatePrivacy,
  updateNotifications,
  deleteAccount,
  exportData
} = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getSettings);
router.put('/account', protect, updateAccount);
router.put('/privacy', protect, updatePrivacy);
router.put('/notifications', protect, updateNotifications);
router.delete('/account', protect, deleteAccount);
router.get('/export', protect, exportData);

module.exports = router;
