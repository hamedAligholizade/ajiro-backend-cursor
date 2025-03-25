const { AppError } = require('../middleware/errorHandler');
const db = require('../models');
const { Op } = require('sequelize');

/**
 * Get all users
 * @route GET /api/users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Build query
    const query = {
      attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active', 'last_login_at', 'created_at', 'updated_at'],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    };

    // Add search filter if provided
    if (req.query.search) {
      query.where = {
        [Op.or]: [
          { first_name: { [Op.iLike]: `%${req.query.search}%` } },
          { last_name: { [Op.iLike]: `%${req.query.search}%` } },
          { email: { [Op.iLike]: `%${req.query.search}%` } }
        ]
      };
    }

    // Add role filter if provided
    if (req.query.role) {
      query.where = {
        ...query.where,
        role: req.query.role
      };
    }

    // Add active status filter if provided
    if (req.query.is_active !== undefined) {
      const isActive = req.query.is_active === 'true';
      query.where = {
        ...query.where,
        is_active: isActive
      };
    }

    const { count, rows: users } = await db.User.findAndCountAll(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.params.id, {
      attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active', 'last_login_at', 'created_at', 'updated_at']
    });

    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 * @route POST /api/users
 */
exports.createUser = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, role, phone } = req.body;

    // Check if email already exists
    const existingUser = await db.User.findOne({ where: { email } });
    if (existingUser) {
      return next(new AppError('Email already in use', 400, 'EMAIL_IN_USE'));
    }

    // Create new user
    const user = await db.User.create({
      email,
      password_hash: password, // Will be hashed via model hook
      first_name,
      last_name,
      role,
      phone,
      is_active: true
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          phone: user.phone,
          is_active: user.is_active,
          created_at: user.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { first_name, last_name, email, role, phone } = req.body;
    const userId = req.params.id;

    // Check if user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Check if email is being changed and is already in use
    if (email && email !== user.email) {
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) {
        return next(new AppError('Email already in use', 400, 'EMAIL_IN_USE'));
      }
    }

    // Only admin can change roles
    if (role && req.user.role !== 'admin') {
      return next(new AppError('You are not authorized to change roles', 403, 'FORBIDDEN'));
    }

    // Update user
    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      email: email || user.email,
      role: role || user.role,
      phone: phone !== undefined ? phone : user.phone
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          phone: user.phone,
          is_active: user.is_active,
          updated_at: user.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate user
 * @route PATCH /api/users/:id/activate
 */
exports.activateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Update user status
    await user.update({ is_active: true });

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      data: {
        user: {
          id: user.id,
          is_active: user.is_active
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate user
 * @route PATCH /api/users/:id/deactivate
 */
exports.deactivateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Prevent deactivating yourself
    if (user.id === req.user.id) {
      return next(new AppError('You cannot deactivate your own account', 400, 'INVALID_OPERATION'));
    }

    // Update user status
    await user.update({ is_active: false });

    // Invalidate all sessions for this user
    await db.UserSession.destroy({
      where: { user_id: userId }
    });

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: {
        user: {
          id: user.id,
          is_active: user.is_active
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (soft delete)
 * @route DELETE /api/users/:id
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return next(new AppError('You cannot delete your own account', 400, 'INVALID_OPERATION'));
    }

    // Soft delete user
    await user.destroy();

    // Invalidate all sessions for this user
    await db.UserSession.destroy({
      where: { user_id: userId }
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * @route GET /api/users/profile
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await db.User.findByPk(req.user.id, {
      attributes: ['id', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active', 'last_login_at', 'created_at', 'updated_at']
    });

    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user profile
 * @route PUT /api/users/profile
 */
exports.updateCurrentUser = async (req, res, next) => {
  try {
    const { first_name, last_name, email, phone } = req.body;
    const userId = req.user.id;

    // Get current user
    const user = await db.User.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Check if email is being changed and is already in use
    if (email && email !== user.email) {
      const existingUser = await db.User.findOne({ where: { email } });
      if (existingUser) {
        return next(new AppError('Email already in use', 400, 'EMAIL_IN_USE'));
      }
    }

    // Update user
    await user.update({
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      email: email || user.email,
      phone: phone !== undefined ? phone : user.phone
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          phone: user.phone,
          updated_at: user.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * @route PUT /api/users/password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current user
    const user = await db.User.findByPk(userId);
    if (!user) {
      return next(new AppError('User not found', 404, 'USER_NOT_FOUND'));
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return next(new AppError('Current password is incorrect', 401, 'INVALID_PASSWORD'));
    }

    // Update password
    user.password_hash = newPassword;
    await user.save();

    // Invalidate all other sessions for security
    await db.UserSession.destroy({
      where: {
        user_id: userId,
        token: { [Op.ne]: req.body.refreshToken || '' }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
}; 