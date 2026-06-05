const jwt = require('jsonwebtoken');
const User = require('../models/User');

const extractToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return req.headers.authorization.split(' ')[1];
  }

  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map((c) => c.trim());
    const tokenCookie = cookies.find((c) => c.startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }

  return null;
};

const protect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User deleted or not found' });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

const optionalProtect = async (req, res, next) => {
  const token = extractToken(req);

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
  } catch (error) {
    console.log('Optional auth token invalid:', error.message);
  }
  next();
};

module.exports = { protect, optionalProtect, authorize };
