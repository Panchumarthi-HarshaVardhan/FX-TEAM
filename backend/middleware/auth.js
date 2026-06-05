const jwt = require('jsonwebtoken');
const { getById } = require('../utils/firebaseHelpers');

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
    const user = await getById('users', decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User deleted or not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user?.role || 'unknown'} is not authorized to access this route`
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
    const user = await getById('users', decoded.id);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.log('Optional auth token invalid:', error.message);
  }
  next();
};

module.exports = { protect, optionalProtect, authorize };
