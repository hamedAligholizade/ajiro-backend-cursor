const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config');
const db = require('../models');
const logger = require('../utils/logger');

// Generate JWT token
const generateToken = async (user, expiresIn = config.jwt.expiresIn) => {
  // Get user's primary shop (owned shop or first accessible shop)
  let primaryShop = null;
  
  // Check for owned shops first
  const ownedShop = await db.Shop.findOne({
    where: {
      owner_id: user.id,
      is_active: true
    }
  });
  
  if (ownedShop) {
    primaryShop = {
      id: ownedShop.id,
      name: ownedShop.name
    };
  } else {
    // Look for shops the user has access to
    const userShop = await db.UserShop.findOne({
      where: {
        user_id: user.id,
        is_active: true
      },
      include: [{
        model: db.Shop,
        as: 'shop'
      }]
    });
    
    if (userShop && userShop.shop) {
      primaryShop = {
        id: userShop.shop.id,
        name: userShop.shop.name
      };
    }
  }
  
  // Include primary shop info in the token if available
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role,
      shop: primaryShop
    },
    config.jwt.secret,
    { expiresIn }
  );
};

// Generate refresh token
const generateRefreshToken = (user) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
  
  // Create a JWT refresh token instead of UUID
  const refreshToken = jwt.sign(
    { 
      id: user.id,
      type: 'refresh'
    },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
  
  return {
    token: refreshToken,
    expiresAt
  };
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { 
      email, 
      password, 
      first_name, 
      last_name,
      phone,
      shop_name
    } = req.body;

    // Check if email is already taken
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError('Email is already in use', 400, 'EMAIL_IN_USE'));
    }

    // Set role based on who is registering
    // If it's self-registration (no authenticated user), set role to manager
    // If an admin is creating a user, they can specify the role
    const role = !req.user ? 'manager' : (req.body.role || 'cashier');

    // Validate role (only admins can create other admins)
    if (role === 'admin' && (!req.user || req.user.role !== 'admin')) {
      return next(new AppError('Only administrators can create admin accounts', 403, 'FORBIDDEN'));
    }

    // Create new user
    const user = await db.User.create({
      email,
      password_hash: password, // bcrypt hashing is handled in User model hooks
      first_name,
      last_name,
      role,
      phone,
      is_active: true
    });

    // If this is self-registration, create a shop for the user
    let shop = null;
    if (!req.user && shop_name) {
      shop = await db.Shop.create({
        name: shop_name,
        owner_id: user.id,
        is_active: true
      });

      // Create user-shop association
      await db.UserShop.create({
        user_id: user.id,
        shop_id: shop.id,
        permissions: { permissions: ["all"] },  // Simple JSON structure
        is_active: true
      });
    }

    // Generate tokens (don't send them for admin-created accounts)
    let tokens = null;
    if (!req.user) {
      // Self-registration
      const accessToken = await generateToken(user);
      const refreshTokenData = generateRefreshToken(user);
      
      // Store refresh token in database
      await db.UserSession.create({
        user_id: user.id,
        token: refreshTokenData.token,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'],
        expires_at: refreshTokenData.expiresAt
      });
      
      tokens = {
        access_token: accessToken,
        refresh_token: refreshTokenData.token,
        expires_in: config.jwt.expiresIn
      };
    }

    // Prepare response
    const userData = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_active: user.is_active
    };

    // Add shop data to response if a shop was created
    const shopData = shop ? {
      id: shop.id,
      name: shop.name,
    } : null;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userData,
        shop: shopData,
        ...tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
    }

    // Check if user is active
    if (!user.is_active) {
      return next(new AppError('Your account has been deactivated', 401, 'ACCOUNT_DEACTIVATED'));
    }

    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
    }

    // Get user's primary shop
    const ownedShop = await db.Shop.findOne({
      where: {
        owner_id: user.id,
        is_active: true
      }
    });

    // If user doesn't own a shop, check for shops they have access to
    let shop = ownedShop;
    if (!shop) {
      const userShop = await db.UserShop.findOne({
        where: {
          user_id: user.id,
          is_active: true
        },
        include: [{
          model: db.Shop,
          as: 'shop'
        }]
      });
      
      if (userShop && userShop.shop) {
        shop = userShop.shop;
      }
    }

    // Generate tokens
    const accessToken = await generateToken(user);
    const refreshTokenData = generateRefreshToken(user);
    
    // Store refresh token in database
    await db.UserSession.create({
      user_id: user.id,
      token: refreshTokenData.token,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      expires_at: refreshTokenData.expiresAt
    });
    
    // Update last login timestamp
    await user.update({ last_login_at: new Date() });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        },
        shop: shop ? {
          id: shop.id,
          name: shop.name
        } : null,
        access_token: accessToken,
        refresh_token: refreshTokenData.token,
        expires_in: config.jwt.expiresIn
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh JWT token
 * @route POST /api/auth/refresh
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new AppError('Refresh token is required', 400, 'REFRESH_TOKEN_REQUIRED'));
    }

    // Find session with this token
    const session = await db.UserSession.findOne({ 
      where: { token: refreshToken }
    });

    if (!session) {
      return next(new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'));
    }

    // Check if session is expired
    if (session.isExpired()) {
      await session.destroy();
      return next(new AppError('Refresh token has expired', 401, 'REFRESH_TOKEN_EXPIRED'));
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (error) {
      return next(new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN'));
    }

    // Find user
    const user = await db.User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      return next(new AppError('User not found or inactive', 401, 'USER_NOT_FOUND'));
    }

    // Generate new tokens
    const newAccessToken = await generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update session
    await session.update({
      token: newRefreshToken.token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken.token
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user by invalidating token
 * @route POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    // Delete session if refresh token is provided
    if (req.body.refreshToken) {
      await db.UserSession.destroy({
        where: { token: req.body.refreshToken }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await db.User.findOne({ where: { email } });
    if (!user) {
      // We don't want to reveal if a user exists or not, so still return success
      return res.status(200).json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link'
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Store token in user session table
    await db.UserSession.create({
      user_id: user.id,
      token: resetToken,
      expires_at: resetTokenExpires,
      user_agent: 'Password Reset'
    });

    // In a real application, send the token via email
    // For development, just log it
    logger.info(`Password reset token for ${email}: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
      // Only include token for development
      ...(config.server.env !== 'production' && { resetToken })
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return next(new AppError('Token and password are required', 400, 'MISSING_FIELDS'));
    }

    // Find session with this token
    const session = await db.UserSession.findOne({ 
      where: { token }
    });

    if (!session || session.isExpired()) {
      return next(new AppError('Invalid or expired token', 400, 'INVALID_TOKEN'));
    }

    // Find user
    const user = await db.User.findByPk(session.user_id);
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Update password
    user.password_hash = password;
    await user.save();

    // Delete all sessions for this user to force login again
    await db.UserSession.destroy({
      where: { user_id: user.id }
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    next(error);
  }
};