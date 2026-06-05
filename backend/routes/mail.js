const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getInbox,
  getSent,
  getRequests,
  getStarred,
  getArchived,
  getTrash,
  getMailById,
  getUserSearch,
  composeMail,
  replyMail,
  markRead,
  markUnread,
  toggleStar,
  archiveMail,
  restoreMail,
  deleteMail,
  acceptRequest,
  rejectRequest,
  connectRequest,
  interviewRequest,
  markInvestedRequest
} = require('../controllers/mailController');

// Folder/Category routes
router.get('/inbox', protect, getInbox);
router.get('/sent', protect, getSent);
router.get('/requests', protect, getRequests);
router.get('/starred', protect, getStarred);
router.get('/archived', protect, getArchived);
router.get('/trash', protect, getTrash);

// Autocomplete and search
router.get('/users/search', protect, getUserSearch);

// Specific mail read
router.get('/:id', protect, getMailById);

// Compose and reply
router.post('/compose', protect, composeMail);
router.post('/:id/reply', protect, replyMail);

// Actions/Status Toggles
router.patch('/:id/read', protect, markRead);
router.patch('/:id/unread', protect, markUnread);
router.patch('/:id/star', protect, toggleStar);
router.patch('/:id/archive', protect, archiveMail);
router.patch('/:id/restore', protect, restoreMail);
router.delete('/:id', protect, deleteMail);

// Business Logic triggers
router.post('/:id/accept', protect, acceptRequest);
router.post('/:id/reject', protect, rejectRequest);
router.post('/:id/connect', protect, connectRequest);
router.post('/:id/interview', protect, interviewRequest);
router.post('/:id/mark-invested', protect, markInvestedRequest);

module.exports = router;
