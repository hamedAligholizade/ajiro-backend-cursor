const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const config = require('../config');
const { User } = require('../models');

/**
 * Middleware to authenticate and authorize users.
 * Extracts JWT token from Authorization header, verifies it,
 * and adds user info to the request object.
 */
const authenticate = async (req, res, next) => {
  try {
    // 1) Check if the token exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    // 2) Extract and verify the token
    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    // 3) Verify the token
    const decoded = jwt.verify(token, config.jwt.secret);

    // 4) Check if user still exists
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return next(new AppError('User no longer exists', 401, 'USER_NOT_FOUND'));
    }

    // 5) Add user info to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid token', 401, 'INVALID_TOKEN'));
  }
};

/**
 * Middleware to restrict access to certain roles
 * @param {string[]} roles - Array of allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN'));
    }

    next();
  };
};

module.exports = {
  authenticate,
  restrictTo
}; 