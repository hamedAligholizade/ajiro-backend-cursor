/**
 * Middleware to ensure shop_id is present in routes that need it
 * If shop_id is not in the request body but the user has an active shop,
 * add the shop_id to the request body automatically
 */

const ensureShopId = (req, res, next) => {
  try {
    // Skip if shop_id is already provided
    if (req.body && req.body.shop_id) {
      return next();
    }
    
    // Check if user is authenticated and has an active shop
    if (req.user && req.user.active_shop_id) {
      // Add the active shop_id to the request body
      req.body.shop_id = req.user.active_shop_id;
      return next();
    }
    
    // For requests that really need shop_id but don't have it
    if (req.originalUrl.includes('/api/orders') && req.method === 'POST') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Shop ID is required',
          code: 'SHOP_ID_REQUIRED'
        }
      });
    }
    
    // For other requests, just continue
    next();
  } catch (error) {
    console.error('Error in ensureShopId middleware:', error);
    next(error);
  }
};

module.exports = ensureShopId; 