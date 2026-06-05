const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth');
const {
  toggleSaveStartup,
  getWatchlist,
  sendInterestRequest,
  getInvestorRequests,
  getOpenInvestors,
  toggleOpenToInvest,
  getInvestorPortalData,
  updatePipelineStage,
  updatePrivateNotes,
  markStartupAsInvested,
  getConnectedStartupUpdates,
  getConnectionDetail,
  addSharedLink,
  updateMeetingNotes
} = require('../controllers/investorController');

router.get('/', optionalProtect, getOpenInvestors);
router.put('/toggle-open', protect, toggleOpenToInvest);

router.post('/save-startup/:id', protect, toggleSaveStartup);
router.get('/watchlist', protect, getWatchlist);
router.post('/interest-request', protect, sendInterestRequest);
router.get('/requests', protect, getInvestorRequests);

// PORTAL ROUTES
router.get('/portal-data', protect, getInvestorPortalData);
router.patch('/pipeline/:id/stage', protect, updatePipelineStage);
router.patch('/pipeline/:id/notes', protect, updatePrivateNotes);
router.patch('/pipeline/:id/invested', protect, markStartupAsInvested);
router.get('/updates', protect, getConnectedStartupUpdates);

// INVESTMENT ROOM DETAILS
router.get('/connection/:id', protect, getConnectionDetail);
router.post('/connection/:id/link', protect, addSharedLink);
router.patch('/connection/:id/meeting-notes', protect, updateMeetingNotes);

module.exports = router;
