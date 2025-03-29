const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/appError');
const config = require('../config');

/**
 * Middleware to authenticate requests using JWT
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateJWT = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Authentication required. Please login.', 401));
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if user still exists
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return next(new AppError('User associated with this token no longer exists.', 401));
    }
    
    // Check if user is active
    if (!user.is_active) {
      return next(new AppError('User account is deactivated.', 401));
    }
    
    // Add user to request object
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token. Please login again.', 401));
    }
    next(error);
  }
};

/**
 * Factory function to restrict access to specific roles
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required. Please login.', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Access denied. ${req.user.role} role is not authorized to perform this action.`, 403)
      );
    }
    
    next();
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles
}; 