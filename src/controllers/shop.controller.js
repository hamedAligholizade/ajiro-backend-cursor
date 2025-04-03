const AppError = require('../utils/appError');
const db = require('../models');
const { Shop, User } = db;
const cryptoUtils = require('../utils/cryptoUtils');

/**
 * Get shop details for the current user
 */
exports.getShopDetails = async (req, res, next) => {
  try {
    // Get user's shop ID from the UserShop relation
    const userShop = await db.UserShop.findOne({
      where: { user_id: req.user.id }
    });

    if (!userShop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    // Get the shop details
    const shop = await Shop.findByPk(userShop.shop_id);
    
    if (!shop) {
      return next(new AppError('Shop not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        shop
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update shop details
 */
exports.updateShop = async (req, res, next) => {
  try {
    // Get user's shop ID from the UserShop relation
    const userShop = await db.UserShop.findOne({
      where: { user_id: req.user.id }
    });

    if (!userShop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    // Check if user is allowed to update the shop (must be owner or admin)
    if (userShop.role !== 'admin' && userShop.role !== 'manager') {
      return next(new AppError('You do not have permission to update this shop', 403));
    }

    // Get the shop to update
    const shop = await Shop.findByPk(userShop.shop_id);
    
    if (!shop) {
      return next(new AppError('Shop not found', 404));
    }

    // Update shop with validated data
    const {
      name,
      description,
      business_type,
      address,
      phone,
      tax_enabled,
      tax_rate,
      currency
    } = req.body;

    // Validate tax rate if provided
    if (tax_rate !== undefined && (tax_rate < 0 || tax_rate > 100)) {
      return next(new AppError('Tax rate must be between 0 and 100', 400));
    }

    // Update shop fields
    await shop.update({
      name: name || shop.name,
      description: description || shop.description,
      business_type: business_type || shop.business_type,
      address: address || shop.address,
      phone: phone || shop.phone,
      tax_enabled: tax_enabled !== undefined ? tax_enabled : shop.tax_enabled,
      tax_rate: tax_rate !== undefined ? tax_rate : shop.tax_rate,
      currency: currency || shop.currency
    });

    res.status(200).json({
      status: 'success',
      data: {
        shop
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update tax settings for the shop
 */
exports.updateTaxSettings = async (req, res, next) => {
  try {
    // Get user's shop ID from the UserShop relation
    const userShop = await db.UserShop.findOne({
      where: { user_id: req.user.id }
    });

    if (!userShop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    // Check if user is allowed to update the shop (must be owner or admin)
    if (userShop.role !== 'admin' && userShop.role !== 'manager') {
      return next(new AppError('You do not have permission to update this shop', 403));
    }

    // Get the shop to update
    const shop = await Shop.findByPk(userShop.shop_id);
    
    if (!shop) {
      return next(new AppError('Shop not found', 404));
    }

    // Get tax settings from request
    const { tax_enabled, tax_rate } = req.body;

    // Validate tax rate if provided
    if (tax_rate !== undefined && (tax_rate < 0 || tax_rate > 100)) {
      return next(new AppError('Tax rate must be between 0 and 100', 400));
    }

    // Update tax settings
    await shop.update({
      tax_enabled: tax_enabled !== undefined ? tax_enabled : shop.tax_enabled,
      tax_rate: tax_rate !== undefined ? tax_rate : shop.tax_rate
    });

    res.status(200).json({
      status: 'success',
      data: {
        tax_enabled: shop.tax_enabled,
        tax_rate: shop.tax_rate
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users associated with a shop
 */
exports.getShopUsers = async (req, res, next) => {
  try {
    // Get user's shop ID from the UserShop relation
    const userShop = await db.UserShop.findOne({
      where: { user_id: req.user.id }
    });

    if (!userShop) {
      return next(new AppError('No shop associated with this user', 400));
    }

    // Get the shop to ensure it exists
    const shop = await Shop.findByPk(userShop.shop_id);
    
    if (!shop) {
      return next(new AppError('Shop not found', 404));
    }

    // Get all users associated with the shop
    const shopUsers = await db.UserShop.findAll({
      where: { shop_id: shop.id },
      include: [{
        model: db.User,
        as: 'User',
        attributes: ['id', 'email', 'first_name', 'last_name', 'is_active']
      }]
    });

    // Format the response
    const formattedUsers = shopUsers.map(userShop => ({
      id: userShop.User.id,
      email: userShop.User.email,
      firstName: userShop.User.first_name,
      lastName: userShop.User.last_name,
      role: userShop.role,
      isActive: userShop.User.is_active,
      joinedAt: userShop.created_at
    }));

    res.status(200).json({
      status: 'success',
      results: formattedUsers.length,
      data: formattedUsers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a user to the shop
 */
exports.addUserToShop = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    // Validate role
    const validRoles = ['manager', 'cashier', 'inventory', 'marketing'];
    if (!validRoles.includes(role)) {
      return next(new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400));
    }

    // Get user's shop ID from the UserShop relation
    const userShop = await db.UserShop.findOne({
      where: { user_id: req.user.id }
    });

    if (!userShop) {
      return next(new AppError('No shop associated with this user', 400));
    }
    
    // Only shop owner or admin can add users
    if (userShop.role !== 'admin' && userShop.role !== 'manager') {
      return next(new AppError('You do not have permission to add users to this shop', 403));
    }

    // Get the shop to ensure it exists
    const shop = await Shop.findByPk(userShop.shop_id);
    
    if (!shop) {
      return next(new AppError('Shop not found', 404));
    }

    // Check if the user exists
    let user = await User.findOne({ where: { email } });

    // If user doesn't exist, create an invitation
    if (!user) {
      // Generate a random password (will be reset on first login)
      const temporaryPassword = Math.random().toString(36).slice(-8);
      
      // Generate salt and hash password
      const salt = await cryptoUtils.genSalt();
      const hashedPassword = await cryptoUtils.hash(temporaryPassword, salt);
      
      // Create new user
      user = await User.create({
        email,
        password_hash: hashedPassword,
        first_name: 'New',
        last_name: 'User',
        role: 'user',
        is_active: true
      });

      // TODO: Send invitation email with temp password
    }

    // Check if user is already associated with the shop
    const existingUserShop = await db.UserShop.findOne({
      where: {
        user_id: user.id,
        shop_id: shop.id
      }
    });

    if (existingUserShop) {
      return next(new AppError('User is already associated with this shop', 400));
    }

    // Add user to shop with specified role
    await db.UserShop.create({
      user_id: user.id,
      shop_id: shop.id,
      role,
      is_active: true
    });

    res.status(201).json({
      status: 'success',
      message: 'User added to shop successfully',
      data: {
        userId: user.id,
        email: user.email,
        role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a user from the shop
 */
exports.removeUserFromShop = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Get user's shop ID from the UserShop relation
    const userShop = await db.UserShop.findOne({
      where: { user_id: req.user.id }
    });

    if (!userShop) {
      return next(new AppError('No shop associated with this user', 400));
    }
    
    // Only shop owner or admin can remove users
    if (userShop.role !== 'admin' && userShop.role !== 'manager') {
      return next(new AppError('You do not have permission to remove users from this shop', 403));
    }

    // Get the shop to ensure it exists
    const shop = await Shop.findByPk(userShop.shop_id);
    
    if (!shop) {
      return next(new AppError('Shop not found', 404));
    }

    // Check if user to remove exists and is associated with the shop
    const userToRemove = await db.UserShop.findOne({
      where: {
        user_id: userId,
        shop_id: shop.id
      }
    });

    if (!userToRemove) {
      return next(new AppError('User not found or not associated with this shop', 404));
    }

    // Prevent removing the shop owner
    if (userToRemove.role === 'admin' && shop.owner_id === userId) {
      return next(new AppError('Cannot remove the shop owner', 403));
    }

    // Remove user from shop
    await userToRemove.destroy();

    res.status(200).json({
      status: 'success',
      message: 'User removed from shop successfully'
    });
  } catch (error) {
    next(error);
  }
}; 