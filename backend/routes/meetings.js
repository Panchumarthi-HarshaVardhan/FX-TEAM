const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createMeeting,
  getMeetings,
  getMeetingByRoomId,
  respondToMeeting,
  cancelMeeting,
  saveChatMessage
} = require('../controllers/meetingController');

// All routes are protected
router.post('/', protect, createMeeting);
router.get('/', protect, getMeetings);
router.get('/:roomId', protect, getMeetingByRoomId);
router.patch('/:id/respond', protect, respondToMeeting);
router.patch('/:id/cancel', protect, cancelMeeting);
router.post('/:id/chat', protect, saveChatMessage);

module.exports = router;
