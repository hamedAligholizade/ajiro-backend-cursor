const AppError = require('../utils/appError');
const db = require('../models');
const { Shop, User } = db;
const cryptoUtils = require('../utils/cryptoUtils');

/**
 * Get shop details for the current user
 */
exports.getShopDetails = async (req, res, next) => {
  try {
    // Get user's shop ID from the ShopStaff relation or from a shop they own
    const userId = req.user.id;
    
    // First check if user is a shop owner
    let shop = await Shop.findOne({
      where: { owner_id: userId }
    });
    
    // If not an owner, check if they're staff somewhere
    if (!shop) {
      const shopStaff = await db.ShopStaff.findOne({
        where: { 
          user_id: userId,
          is_active: true
        }
      });
      
      if (!shopStaff) {
        return next(new AppError('No shop associated with this user', 400));
      }
      
      shop = await Shop.findByPk(shopStaff.shop_id);
    }
    
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
    const userId = req.user.id;
    let isOwner = false;
    let shop;
    
    // First check if user is a shop owner
    shop = await Shop.findOne({
      where: { owner_id: userId }
    });
    
    if (shop) {
      isOwner = true;
    } else {
      // Check if user is staff with admin/manager privileges
      const shopStaff = await db.ShopStaff.findOne({
        where: { 
          user_id: userId,
          is_active: true,
          role: {
            [db.Sequelize.Op.in]: ['admin', 'manager']
          }
        }
      });
      
      if (!shopStaff) {
        return next(new AppError('No shop associated with this user or insufficient permissions', 403));
      }
      
      shop = await Shop.findByPk(shopStaff.shop_id);
    }
    
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
    const userId = req.user.id;
    let shop;
    
    // Check if user is a shop owner
    shop = await Shop.findOne({
      where: { owner_id: userId }
    });
    
    // If not an owner, check if they're an admin/manager
    if (!shop) {
      const staffMember = await db.ShopStaff.findOne({
        where: { 
          user_id: userId,
          is_active: true,
          role: {
            [db.Sequelize.Op.in]: ['admin', 'manager']
          }
        }
      });
      
      if (!staffMember) {
        return next(new AppError('You do not have permission to update tax settings', 403));
      }
      
      shop = await Shop.findByPk(staffMember.shop_id);
    }
    
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
      success: true,
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
    const userId = req.user.id;
    let shop;
    
    // First check if user is a shop owner
    shop = await Shop.findOne({
      where: { owner_id: userId }
    });
    
    if (!shop) {
      // Check if user is staff
      const shopStaff = await db.sequelize.query(`
        SELECT * FROM shop_staff 
        WHERE user_id = :userId AND is_active = true
        LIMIT 1
      `, {
        replacements: { userId },
        type: db.sequelize.QueryTypes.SELECT,
        plain: true
      });
      
      if (!shopStaff) {
        return next(new AppError('No shop associated with this user', 400));
      }
      
      shop = await Shop.findByPk(shopStaff.shop_id);
    }
    
    if (!shop) {
      return next(new AppError('Shop not found', 404));
    }

    // Get all staff users associated with the shop using raw query to avoid deleted_at issues
    const staffMembers = await db.sequelize.query(`
      SELECT ss.*, 
             u.id as "user.id", 
             u.email as "user.email", 
             u.first_name as "user.first_name", 
             u.last_name as "user.last_name", 
             u.is_active as "user.is_active"
      FROM shop_staff ss
      JOIN users u ON ss.user_id = u.id
      WHERE ss.shop_id = :shopId AND ss.is_active = true
    `, {
      replacements: { shopId: shop.id },
      type: db.sequelize.QueryTypes.SELECT,
      nest: true
    });
    
    // Add the owner if not already in the list
    const ownerIncluded = staffMembers.some(staff => staff.user.id === shop.owner_id);
    let allUsers = [];
    
    if (!ownerIncluded) {
      const owner = await db.User.findByPk(shop.owner_id, {
        attributes: ['id', 'email', 'first_name', 'last_name', 'is_active']
      });
      
      if (owner) {
        allUsers.push({
          id: owner.id,
          email: owner.email,
          firstName: owner.first_name,
          lastName: owner.last_name,
          role: 'owner',
          isActive: owner.is_active,
          joinedAt: shop.created_at
        });
      }
    }
    
    // Format the staff members
    const formattedStaff = staffMembers.map(staff => ({
      id: staff.user.id,
      email: staff.user.email,
      firstName: staff.user.first_name,
      lastName: staff.user.last_name,
      role: staff.role,
      isActive: staff.user.is_active,
      joinedAt: staff.created_at
    }));
    
    allUsers = [...allUsers, ...formattedStaff];

    res.status(200).json({
      success: true,
      results: allUsers.length,
      data: allUsers
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
    const userId = req.user.id;
    let shop;
    
    // Validate role
    const validRoles = ['admin', 'manager', 'cashier', 'inventory', 'marketing'];
    if (!validRoles.includes(role)) {
      return next(new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400));
    }

    // Check if user is a shop owner
    shop = await Shop.findOne({
      where: { owner_id: userId }
    });
    
    // If not an owner, check if they're an admin/manager
    if (!shop) {
      const staffMember = await db.ShopStaff.findOne({
        where: { 
          user_id: userId,
          is_active: true,
          role: {
            [db.Sequelize.Op.in]: ['admin', 'manager']
          }
        }
      });
      
      if (!staffMember) {
        return next(new AppError('You do not have permission to add users to this shop', 403));
      }
      
      shop = await Shop.findByPk(staffMember.shop_id);
    }
    
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
    const existingStaff = await db.ShopStaff.findOne({
      where: {
        user_id: user.id,
        shop_id: shop.id
      }
    });

    if (existingStaff) {
      return next(new AppError('User is already associated with this shop', 400));
    }

    // Add user to shop with specified role
    await db.ShopStaff.create({
      user_id: user.id,
      shop_id: shop.id,
      role,
      is_active: true
    });

    res.status(201).json({
      success: true,
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
    const currentUserId = req.user.id;
    let shop;
    
    // Check if current user is a shop owner
    shop = await Shop.findOne({
      where: { owner_id: currentUserId }
    });
    
    // If not an owner, check if they're an admin/manager
    if (!shop) {
      const staffMember = await db.ShopStaff.findOne({
        where: { 
          user_id: currentUserId,
          is_active: true,
          role: {
            [db.Sequelize.Op.in]: ['admin', 'manager']
          }
        }
      });
      
      if (!staffMember) {
        return next(new AppError('You do not have permission to remove users from this shop', 403));
      }
      
      shop = await Shop.findByPk(staffMember.shop_id);
    }
    
    if (!shop) {
      return next(new AppError('Shop not found', 404));
    }

    // Check if user to remove exists and is associated with the shop
    const userToRemove = await db.ShopStaff.findOne({
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
      success: true,
      message: 'User removed from shop successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all shops for the current user
 */
exports.getUserShops = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Find shops owned by the user
    const ownedShops = await Shop.findAll({
      where: { owner_id: userId },
      attributes: ['id', 'name', 'description', 'business_type', 'is_active', 'created_at', 'updated_at']
    });
    
    // Find shops where user is a staff member - with explicit join to avoid deleted_at issues
    const staffShops = await db.sequelize.query(`
      SELECT s.id, s.name, s.description, s.business_type, s.is_active, s.created_at, s.updated_at
      FROM shops s
      JOIN shop_staff ss ON s.id = ss.shop_id
      WHERE ss.user_id = :userId AND ss.is_active = true
    `, {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT,
      model: Shop,
      mapToModel: true
    });
    
    // Combine both lists and remove duplicates
    const allShops = [...ownedShops];
    staffShops.forEach(shop => {
      if (!allShops.some(s => s.id === shop.id)) {
        allShops.push(shop);
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        shops: allShops
      }
    });
  } catch (error) {
    next(error);
  }
}; 