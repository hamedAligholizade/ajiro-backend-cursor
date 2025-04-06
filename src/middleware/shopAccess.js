const { AppError } = require('../middleware/errorHandler');
const db = require('../models');

/**
 * Middleware to verify user has access to a shop
 * @param {Object} options - Options for the middleware
 * @param {boolean} options.allowOwnerOnly - Whether to allow only shop owners or also staff
 * @param {string} options.shopIdParam - Name of the parameter containing shop ID (default: 'shopId')
 * @returns {Function} Express middleware function
 */
exports.verifyShopAccess = (options = {}) => {
  const { allowOwnerOnly = false, shopIdParam = 'shopId' } = options;

  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      let shopId = req.params[shopIdParam] || req.body.shop_id || req.query.shop_id;
      
      // If shop is already set in request (by setShopContext middleware)
      if (req.shop) {
        shopId = req.shop.id;
      }

      // If still no shop ID, try to find the user's default shop
      if (!shopId) {
        // Find shops where the user is the owner
        const userShop = await db.Shop.findOne({
          where: {
            owner_id: userId,
            is_active: true
          }
        });
        
        if (userShop) {
          shopId = userShop.id;
          req.shop = userShop;
          // Also set in query and body params for controllers that expect it there
          req.query.shop_id = userShop.id;
          req.body.shop_id = userShop.id;
        } else {
          return next(new AppError('Shop ID is required', 400, 'SHOP_ID_REQUIRED'));
        }
      }

      // If we already have shop from context, skip the lookup
      if (!req.shop) {
        // Find shop
        const shop = await db.Shop.findByPk(shopId);
        if (!shop) {
          return next(new AppError('Shop not found', 404, 'SHOP_NOT_FOUND'));
        }
        req.shop = shop;
      }

      // Check if user is owner
      const isOwner = req.shop.owner_id === userId;

      // If only owner is allowed and user is not owner, deny access
      if (allowOwnerOnly && !isOwner) {
        return next(new AppError('Unauthorized - Only shop owner can access this resource', 403, 'OWNER_ONLY'));
      }

      // Check if user has access to shop
      if (!isOwner) {
        // Check if user is staff member
        const hasAccess = await db.ShopStaff.findOne({
          where: {
            shop_id: shopId,
            user_id: userId,
            is_active: true
          }
        });

        if (!hasAccess) {
          return next(new AppError('Unauthorized - You do not have access to this shop', 403, 'UNAUTHORIZED'));
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to set shop context based on request parameters
 * Tries to find shop_id from request parameters, query, or body
 * If no shop_id is provided, tries to find the user's default shop
 */
exports.setShopContext = async (req, res, next) => {
  try {
    // Try to find shop_id from various places
    const shopId = req.params.shopId || req.query.shop_id || req.body.shop_id;
    
    if (shopId) {
      // Find shop
      const shop = await db.Shop.findByPk(shopId);
      if (shop) {
        // Set shop in request for later use
        req.shop = shop;
        next();
        return;
      }
    }
    
    // If no shop_id was provided or shop wasn't found, try to find the user's default shop
    if (req.user && req.user.id) {
      // Find shops where the user is the owner
      const userShop = await db.Shop.findOne({
        where: {
          owner_id: req.user.id,
          is_active: true
        }
      });
      
      if (userShop) {
        // Set the first shop as the default
        req.shop = userShop;
        // Also set in query params for controllers that expect it there
        req.query.shop_id = userShop.id;
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
}; 