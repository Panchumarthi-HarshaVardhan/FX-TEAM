const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { submitRequest, getRequests, reviewRequest, submitFounderVerification, submitInvestorVerification } = require('../controllers/verificationController');

router.post('/', protect, submitRequest);
router.get('/', protect, getRequests); // Should be admin only
router.put('/:id/review', protect, reviewRequest); // Should be admin only

router.post('/founder', protect, submitFounderVerification);
router.post('/investor', protect, submitInvestorVerification);

module.exports = router;
