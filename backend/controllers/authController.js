const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const sendEmail = require('../utils/mailer');
const {
  create,
  getAll,
  getById,
  updateById,
  deleteById,
  findOneByField,
  findOne
} = require('../utils/firebaseHelpers');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const toPublicUser = (user) => {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
};

const normalizeRole = (role) => {
  if (!role) return 'founder';
  if (role === 'job_seeker') return 'user';
  if (['founder', 'investor', 'admin', 'user'].includes(role)) return role;
  return 'founder';
};

const generateUniqueUsername = async (base) => {
  const allUsers = await getAll('users');
  let username = (base || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!username) username = 'user';
  let candidate = username;
  let counter = 0;
  while (allUsers.some((existing) => existing.username === candidate)) {
    counter += 1;
    candidate = `${username}${Math.floor(Math.random() * 900 + 100) + counter}`;
  }
  return candidate;
};

exports.register = async (req, res) => {
  try {
    let { fullName, name, email, password, role, username } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const chosenName = fullName || name;
    if (!chosenName) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const normalizedRole = normalizeRole(role);
    const existingEmailUser = await findOneByField('users', 'email', email.trim().toLowerCase());

    if (existingEmailUser) {
      if (existingEmailUser.isEmailVerified) {
        return res.status(400).json({ message: 'User already exists' });
      }
      await deleteById('users', existingEmailUser.id);
    }

    const emailLower = email.trim().toLowerCase();
    const usernameValue = username ? username.trim().toLowerCase() : await generateUniqueUsername(chosenName);

    if (username) {
      const existingUsername = await findOneByField('users', 'username', usernameValue);
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const userData = {
      fullName: chosenName,
      name: chosenName,
      email: emailLower,
      username: usernameValue,
      passwordHash,
      role: normalizedRole,
      profileCompleted: false,
      isActive: true,
      isVerified: false,
      isEmailVerified: false,
      emailVerificationOtp: otp,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      createdAt: Date.now()
    };

    const user = await create('users', userData);
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
        <h2 style="color: #333;">Welcome to FounderX!</h2>
        <p style="color: #555; font-size: 16px;">Please use the following OTP to verify your email address. This OTP is valid for 24 hours.</p>
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

    const token = generateToken(user.id);
    const userPublic = toPublicUser(user);
    userPublic.token = token;

    res.status(201).cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    }).json(userPublic);
  } catch (error) {
    console.error('Registration error:', error);
    const message = error.message || 'Server Error';
    res.status(500).json({ message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await findOneByField('users', 'email', email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: 'This account does not have a password. Please sign in with Google or reset your credentials.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: 'Please verify your email address to log in.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await updateById('users', user.id, {
      loginOtp: otp,
      loginOtpExpires: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaec; border-radius: 10px;">
        <h2 style="color: #333;">Login OTP Verification</h2>
        <p style="color: #555; font-size: 16px;">Please use the following OTP to complete your login. This OTP is valid for 60 minutes.</p>
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

    res.status(200).json({ requireOtp: true, email: user.email, message: 'OTP sent to email' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized, user missing' });
    }
    const user = await getById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(toPublicUser(user));
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await findOne('users', (item) => {
      return item.email === email.trim().toLowerCase() &&
        item.emailVerificationOtp === otp &&
        item.emailVerificationExpires > Date.now();
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await updateById('users', user.id, {
      isEmailVerified: true,
      emailVerifiedAt: Date.now(),
      emailVerificationOtp: null,
      emailVerificationExpires: null
    });

    const token = generateToken(user.id);
    const userPublic = toPublicUser({ ...user, isEmailVerified: true });
    userPublic.token = token;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    }).status(200).json(userPublic);
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

exports.sendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await findOneByField('users', 'email', email.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await updateById('users', user.id, {
      emailVerificationOtp: otp,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    await sendEmail({
      email: user.email,
      subject: 'Your FounderX verification OTP',
      html: `Your verification code is: <strong>${otp}</strong>`
    });

    res.status(200).json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Send verification email error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { token, role } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    // Call Google's userinfo API using the access token
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const payload = response.data;
    if (!payload || !payload.email) {
      return res.status(400).json({ message: 'Invalid Google token' });
    }

    const email = payload.email.toLowerCase();
    let user = await findOneByField('users', 'email', email);
    if (!user) {
      const baseName = payload.name || email.split('@')[0];
      const usernameValue = await generateUniqueUsername(baseName);
      user = await create('users', {
        fullName: payload.name || usernameValue,
        name: payload.name || usernameValue,
        email,
        username: usernameValue,
        role: normalizeRole(role),
        googleId: payload.sub,
        profileImage: payload.picture || null,
        isEmailVerified: true,
        isActive: true,
        isVerified: false,
        createdAt: Date.now()
      });
    } else {
      const updates = { isEmailVerified: true };
      let changed = false;
      if (!user.googleId) {
        updates.googleId = payload.sub;
        changed = true;
      }
      if (payload.picture && user.profileImage !== payload.picture) {
        updates.profileImage = payload.picture;
        changed = true;
      }
      if (changed || !user.isEmailVerified) {
        await updateById('users', user.id, updates);
        user = { ...user, ...updates };
      }
    }

    const jwtToken = generateToken(user.id);
    const userPublic = toPublicUser(user);
    userPublic.token = jwtToken;

    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    }).status(200).json(userPublic);
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: error.message || 'Server Error' });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await findOne('users', (item) => {
      return item.email === email.trim().toLowerCase() &&
        item.loginOtp === otp &&
        item.loginOtpExpires > Date.now();
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Clear OTP fields
    await updateById('users', user.id, {
      loginOtp: null,
      loginOtpExpires: null
    });

    // Generate JWT and log user in
    const token = generateToken(user.id);
    const userPublic = toPublicUser({ ...user, loginOtp: null, loginOtpExpires: null });
    userPublic.token = token;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    }).status(200).json(userPublic);
  } catch (error) {
    console.error('Login OTP verification error:', error);
    res.status(500).json({ message: 'Server error during OTP verification' });
  }
};
