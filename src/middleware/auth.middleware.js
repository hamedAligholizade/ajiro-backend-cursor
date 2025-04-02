const jwt = require('jsonwebtoken');
const db = require('../models');
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
    const user = await db.User.findByPk(decoded.id);
    
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

/**
 * Middleware to check if user has access to specified shop
 * @param {Object} options - Options object
 * @param {boolean} options.allowOwnerOnly - If true, only shop owner can access
 * @param {string[]} options.requiredPermissions - Array of required permissions
 * @returns {Function} - Express middleware function
 */
const authorizeShopAccess = (options = {}) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required. Please login.', 401));
    }
    
    // Get shop_id from request parameters, query, or body
    const shopId = req.params.shop_id || req.query.shop_id || req.body.shop_id;
    
    if (!shopId) {
      return next(new AppError('Shop ID is required', 400));
    }
    
    try {
      // Check if user is the shop owner (always has access)
      const shop = await db.Shop.findByPk(shopId);
      
      if (!shop) {
        return next(new AppError('Shop not found', 404));
      }
      
      // If user is the shop owner, they always have access
      if (shop.owner_id === req.user.id) {
        // Add shop to request for use in controller
        req.shop = shop;
        return next();
      }
      
      // If allowOwnerOnly option is set, deny access to non-owners
      if (options.allowOwnerOnly) {
        return next(new AppError('Only the shop owner can perform this action', 403));
      }
      
      // Check if user has access to this shop
      const userShop = await db.UserShop.findOne({
        where: {
          user_id: req.user.id,
          shop_id: shopId,
          is_active: true
        }
      });
      
      if (!userShop) {
        return next(new AppError('You do not have access to this shop', 403));
      }
      
      // Check if user has required permissions
      if (options.requiredPermissions && options.requiredPermissions.length > 0) {
        const hasRequiredPermissions = options.requiredPermissions.every(permission => 
          userShop.permissions.includes(permission) || userShop.permissions.includes('all')
        );
        
        if (!hasRequiredPermissions) {
          return next(new AppError('You do not have the required permissions for this action', 403));
        }
      }
      
      // Add shop to request for use in controller
      req.shop = shop;
      req.userShop = userShop;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticateJWT,
  authorizeRoles,
  authorizeShopAccess
}; 