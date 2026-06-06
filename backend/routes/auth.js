const express = require('express');
const router = express.Router();
const { register, login, getMe, verifyEmail, sendVerificationEmail, googleAuth, verifyLoginOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/verify-email', verifyEmail);
router.post('/send-verification', sendVerificationEmail);
router.post('/google', googleAuth);
router.post('/verify-login-otp', verifyLoginOtp);

module.exports = router;
