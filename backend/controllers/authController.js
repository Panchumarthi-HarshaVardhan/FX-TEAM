const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../utils/mailer');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/'
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    let { fullName, name, email, password, role } = req.body;
    if (role === 'job_seeker') {
      role = 'user';
    }

    const chosenName = fullName || name;
    if (!chosenName) {
      return res.status(400).json({ message: 'Full name is required' });
    }
    
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Validate role
    if (role && !['user', 'founder', 'investor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be user, founder or investor.' });
    }

    let userExists = await User.findOne({ email });

    if (userExists) {
      if (userExists.isEmailVerified) {
        return res.status(400).json({ message: 'User already exists' });
      } else {
        // Unverified user trying to sign up again - delete the old unverified record to start fresh
        await User.deleteOne({ _id: userExists._id });
      }
    }

    // Generate unique username if not provided
    let username = req.body.username;
    if (!username) {
      const baseUsername = chosenName.toLowerCase().replace(/[^a-z0-9]/g, '');
      username = baseUsername || 'user';
      let isUnique = false;
      let counter = 0;

      while (!isUnique) {
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
          isUnique = true;
        } else {
          counter++;
          username = `${baseUsername || 'user'}${Math.floor(Math.random() * 1000) + counter}`;
        }
      }
    } else {
      // Check if provided username exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    // Create user
    const user = await User.create({
      fullName: chosenName,
      name: chosenName,
      email,
      passwordHash: password,
      role: role || 'founder',
      username,
      profileCompleted: false
    });

    if (user) {
      // Generate 6-digit email verification OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.emailVerificationOtp = otp;
      user.emailVerificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
      await user.save({ validateBeforeSave: false });

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
          <h2 style="color: #333;">Welcome to FounderX!</h2>
          <p style="color: #555; font-size: 16px;">Please use the following OTP to verify your email address. This OTP is valid for 15 minutes.</p>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otp}</span>
          </div>
          <p style="color: #999; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject: 'Verify your email address - FounderX',
        html: emailHtml
      });
      
      console.log('-------------------------------------------');
      console.log('VERIFICATION OTP: ', otp);
      console.log('-------------------------------------------');

      const token = generateToken(user._id);
      const userPublic = user.toPublicJSON();
      userPublic.token = token;

      res
        .cookie('token', token, cookieOptions)
        .status(201)
        .json(userPublic);
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    let message = 'Server Error';
    if (error.name === 'ValidationError') {
      message = Object.values(error.errors).map(val => val.message).join(', ');
    } else if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      message = `An account with this ${field} already exists.`;
    } else if (error.message) {
      message = error.message;
    }
    res.status(500).json({ message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email })
      .populate({
        path: 'founderProfile',
        populate: {
          path: 'startups',
          select: 'name logo oneLinePitch slug'
        }
      })
      .populate('investorProfile')
      .populate('jobSeekerProfile');

    if (user) {
      if (!user.passwordHash && user.googleId) {
        return res.status(400).json({ message: 'This email is registered with Google. Please use "Continue with Google" to log in.' });
      }

      if (await user.comparePassword(password)) {
        // Check if email is verified
        if (!user.isEmailVerified) {
          // Auto-verify for development/testing if email failed to send
          user.isEmailVerified = true;
          user.emailVerifiedAt = Date.now();
          await user.save({ validateBeforeSave: false });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.loginOtp = otp;
        user.loginOtpExpires = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save({ validateBeforeSave: false });

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
            <h2 style="color: #333;">Login OTP Verification</h2>
            <p style="color: #555; font-size: 16px;">Please use the following OTP to complete your login. This OTP is valid for 10 minutes.</p>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 14px;">If you didn't request this, please secure your account immediately.</p>
          </div>
        `;

        await sendEmail({
          email: user.email,
          subject: 'Your Login OTP - FounderX',
          html: emailHtml
        });

        console.log('-------------------------------------------');
        console.log('LOGIN OTP for', user.email, ':', otp);
        console.log('-------------------------------------------');

        return res.status(200).json({ requireOtp: true, email: user.email, message: 'OTP sent to email' });
      } else {
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-passwordHash -password')
      .populate({
        path: 'founderProfile',
        populate: {
          path: 'startups',
          select: 'name logo oneLinePitch slug'
        }
      })
      .populate('investorProfile')
      .populate('jobSeekerProfile');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user.toPublicJSON());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Verify email address
// @route   POST /api/auth/verify-email
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({
      email,
      emailVerificationOtp: otp,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isEmailVerified = true;
    user.emailVerifiedAt = Date.now();
    user.emailVerificationOtp = undefined;
    user.emailVerificationExpires = undefined;
    
    await user.save({ validateBeforeSave: false });

    // Generate token so they can be logged in immediately after verification
    const token = generateToken(user._id);
    const userPublic = user.toPublicJSON();
    userPublic.token = token;

    res.cookie('token', token, cookieOptions).status(200).json({ 
      success: true, 
      message: 'Email verified successfully',
      user: userPublic
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error during email verification' });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/send-verification
// @access  Private
exports.sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationOtp = otp;
    user.emailVerificationExpires = Date.now() + 15 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
        <h2 style="color: #333;">Verify your Email</h2>
        <p style="color: #555; font-size: 16px;">Please use the following OTP to verify your email address. This OTP is valid for 15 minutes.</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `;

    const emailSent = await sendEmail({
      email: user.email,
      subject: 'Verify your email address - FounderX',
      html: emailHtml
    });
    
    console.log('-------------------------------------------');
    console.log('RESENT VERIFICATION OTP: ', otp);
    console.log('-------------------------------------------');

    if (emailSent) {
      res.status(200).json({ success: true, message: 'Verification email sent' });
    } else {
      res.status(500).json({ message: 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Authenticate with Google
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  try {
    const { token, role } = req.body; // role is only passed during signup

    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    const axios = require('axios');
    // Verify token with Google
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const payload = response.data;
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email })
      .populate({
        path: 'founderProfile',
        populate: {
          path: 'startups',
          select: 'name logo oneLinePitch slug'
        }
      })
      .populate('investorProfile')
      .populate('jobSeekerProfile');

    if (!user) {
      // If no role is provided, this is a login attempt. Do not automatically register a new user.
      if (!role) {
        return res.status(404).json({ message: 'Account does not exist. Please sign up first.' });
      }

      // New user - requires role if we enforce it, or default to founder
      let newRole = role;
      if (newRole === 'job_seeker') {
        newRole = 'user';
      }
      if (!['user', 'founder', 'investor'].includes(newRole)) {
        return res.status(400).json({ message: 'Invalid role provided' });
      }

      // Generate base username from email
      let baseUsername = email.split('@')[0].replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let isUnique = false;
      let counter = 0;

      while (!isUnique) {
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
          isUnique = true;
        } else {
          counter++;
          username = `${baseUsername}${counter}`;
        }
      }

      user = await User.create({
        fullName: name,
        name: name,
        email,
        username,
        role: newRole,
        profileImage: picture,
        googleId,
        googleVerified: true,
        isEmailVerified: true, // Google emails are verified
        emailVerifiedAt: Date.now(),
        profileCompleted: false
      });
    } else {
      // Existing user
      if (user.passwordHash && !user.googleId) {
        return res.status(400).json({ message: 'This email is already registered. Please log in using your email and password.' });
      }

      // Existing user, just update google verification fields
      user.googleId = googleId;
      user.googleVerified = true;
      user.isEmailVerified = true;
      
      if (!user.profileImage) {
        user.profileImage = picture;
      }
      
      await user.save({ validateBeforeSave: false });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.loginOtp = otp;
    user.loginOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
        <h2 style="color: #333;">Login OTP Verification</h2>
        <p style="color: #555; font-size: 16px;">Please use the following OTP to complete your login. This OTP is valid for 10 minutes.</p>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #007bff;">${otp}</span>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Your Login OTP - FounderX',
      html: emailHtml
    });

    console.log('-------------------------------------------');
    console.log('GOOGLE LOGIN OTP for', user.email, ':', otp);
    console.log('-------------------------------------------');

    res.status(200).json({ requireOtp: true, email: user.email, message: 'OTP sent to email' });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

// @desc    Verify login OTP
// @route   POST /api/auth/verify-login-otp
// @access  Public
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({
      email,
      loginOtp: otp,
      loginOtpExpires: { $gt: Date.now() }
    })
      .populate({
        path: 'founderProfile',
        populate: {
          path: 'startups',
          select: 'name logo oneLinePitch slug'
        }
      })
      .populate('investorProfile')
      .populate('jobSeekerProfile');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP fields
    user.loginOtp = undefined;
    user.loginOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // Generate JWT and log user in
    const token = generateToken(user._id);
    const userPublic = user.toPublicJSON();
    userPublic.token = token;

    res
      .cookie('token', token, cookieOptions)
      .status(200)
      .json(userPublic);
  } catch (error) {
    console.error('Login OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};
