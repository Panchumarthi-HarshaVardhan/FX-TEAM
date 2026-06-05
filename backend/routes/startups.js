const express = require('express');
const router = express.Router();
const {
  getStartups,
  getStartup,
  createStartup,
  updateStartup,
  deleteStartup,
  toggleSaveStartup,
  applyToStartup,
  requestInvestment,
  reportStartup,
  getStartupAnalytics,
  getStartupApplications,
  getStartupInvestmentRequests,
  updateApplicationStatus,
  updateInvestmentRequestStatus,
  getStartupBadge,
  followStartup,
  unfollowStartup,
  saveStartup,
  unsaveStartup,
  getStartupJobs,
  createStartupJob,
  createStartupRoleRequest,
  aiFilterStartups
} = require('../controllers/startupController');

const { protect, authorize, optionalProtect } = require('../middleware/auth');

router.get('/:id/badge', getStartupBadge);

router.post('/ai-filter', optionalProtect, aiFilterStartups);

router
  .route('/')
  .get(optionalProtect, getStartups)
  .post(protect, authorize('founder', 'admin'), createStartup);

router.route('/:id/follow')
  .post(protect, followStartup)
  .delete(protect, unfollowStartup);

router.route('/:id/save')
  .post(protect, saveStartup)
  .delete(protect, unsaveStartup);

router.route('/:id/jobs')
  .get(getStartupJobs)
  .post(protect, createStartupJob);

router.put('/save/:id', protect, toggleSaveStartup);
router.post('/:id/apply', protect, applyToStartup);
router.post('/:id/role-request', protect, createStartupRoleRequest);
router.post('/:id/invest', protect, requestInvestment);
router.post('/:id/report', protect, reportStartup);
router.get('/:id/analytics', protect, getStartupAnalytics);
router.get('/:id/applications', protect, getStartupApplications);
router.get('/:id/investment-requests', protect, getStartupInvestmentRequests);

router.put('/applications/:id/status', protect, updateApplicationStatus);
router.put('/investment-requests/:id/status', protect, updateInvestmentRequestStatus);

router
  .route('/:id')
  .get(optionalProtect, getStartup)
  .put(protect, authorize('founder', 'admin'), updateStartup)
  .delete(protect, authorize('founder', 'admin'), deleteStartup);

module.exports = router;
