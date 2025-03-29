const { Op } = require('sequelize');
const db = require('../models');
const AppError = require('../utils/appError');
const { paginate } = require('../utils/pagination');

/**
 * Controller for inventory management
 */
const InventoryController = {
  /**
   * Get all inventory items with pagination and filtering options
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  getAllInventory: async (req, res, next) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category_id, 
        low_stock = false,
        search,
        sort_by = 'stock_quantity',
        sort_order = 'desc'
      } = req.query;

      // Build filter conditions
      const filters = {};
      const productFilters = {};
      
      if (category_id) {
        productFilters.category_id = category_id;
      }
      
      if (search) {
        productFilters[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { sku: { [Op.iLike]: `%${search}%` } },
          { barcode: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      if (low_stock === 'true') {
        filters[Op.and] = [
          db.sequelize.literal('stock_quantity <= COALESCE(reorder_level, 10)')
        ];
      }
      
      // Set up include for product relation
      const includeProduct = {
        model: db.Product,
        as: 'product',
        where: productFilters,
        attributes: ['id', 'name', 'sku', 'barcode', 'category_id', 'selling_price', 'image_url'],
        include: [{
          model: db.Category,
          as: 'category',
          attributes: ['id', 'name']
        }]
      };
      
      // Determine order direction
      const order = [
        [sort_by, sort_order.toUpperCase()]
      ];
      
      // Get paginated inventory data
      const { rows, count, totalPages, currentPage } = await paginate({
        model: db.Inventory,
        page,
        limit,
        where: filters,
        include: [includeProduct],
        order
      });
      
      res.status(200).json({
        status: 'success',
        count,
        totalPages,
        currentPage,
        data: rows
      });
    } catch (error) {
      next(new AppError(`Error retrieving inventory: ${error.message}`, 500));
    }
  },

  /**
   * Get inventory details for a specific product
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  getInventoryByProductId: async (req, res, next) => {
    try {
      const { id } = req.params;
      
      const inventory = await db.Inventory.findOne({
        where: { product_id: id },
        include: [{
          model: db.Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'barcode', 'image_url'],
          include: [{
            model: db.Category,
            as: 'category',
            attributes: ['id', 'name']
          }]
        }]
      });
      
      if (!inventory) {
        return next(new AppError('Inventory not found for this product', 404));
      }
      
      res.status(200).json({
        status: 'success',
        data: inventory
      });
    } catch (error) {
      next(new AppError(`Error retrieving inventory: ${error.message}`, 500));
    }
  },

  /**
   * Update inventory for a specific product
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  updateInventory: async (req, res, next) => {
    const transaction = await db.sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { 
        stock_quantity,
        available_quantity,
        reserved_quantity,
        reorder_level,
        reorder_quantity,
        location,
        adjustment_reason
      } = req.body;
      
      // Check if product exists
      const product = await db.Product.findByPk(id);
      if (!product) {
        await transaction.rollback();
        return next(new AppError('Product not found', 404));
      }
      
      // Find or create inventory record
      const [inventory, created] = await db.Inventory.findOrCreate({
        where: { product_id: id },
        defaults: {
          product_id: id,
          stock_quantity: 0,
          available_quantity: 0,
          reserved_quantity: 0
        }
      });
      
      // Get original values for comparison
      const originalStock = inventory.stock_quantity;
      
      // Update inventory
      const updates = {};
      if (stock_quantity !== undefined) updates.stock_quantity = stock_quantity;
      if (available_quantity !== undefined) updates.available_quantity = available_quantity;
      if (reserved_quantity !== undefined) updates.reserved_quantity = reserved_quantity;
      if (reorder_level !== undefined) updates.reorder_level = reorder_level;
      if (reorder_quantity !== undefined) updates.reorder_quantity = reorder_quantity;
      if (location !== undefined) updates.location = location;
      
      if (Object.keys(updates).length > 0) {
        await inventory.update(updates, { transaction });
      }
      
      // If stock was changed, create a transaction record
      if (stock_quantity !== undefined && stock_quantity !== originalStock) {
        const quantity = stock_quantity - originalStock;
        
        await db.InventoryTransaction.create({
          product_id: id,
          quantity,
          transaction_type: 'adjustment',
          note: adjustment_reason || 'Manual inventory adjustment',
          user_id: req.user.id
        }, { transaction });
      }
      
      await transaction.commit();
      
      // Return updated inventory
      const updatedInventory = await db.Inventory.findOne({
        where: { product_id: id },
        include: [{
          model: db.Product,
          as: 'product',
          attributes: ['id', 'name', 'sku']
        }]
      });
      
      res.status(200).json({
        status: 'success',
        data: updatedInventory
      });
    } catch (error) {
      await transaction.rollback();
      next(new AppError(`Error updating inventory: ${error.message}`, 500));
    }
  },

  /**
   * Get inventory transaction history for a product
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  getInventoryHistory: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      // Check if product exists
      const product = await db.Product.findByPk(id);
      if (!product) {
        return next(new AppError('Product not found', 404));
      }
      
      // Get transaction history with pagination
      const { rows, count, totalPages, currentPage } = await paginate({
        model: db.InventoryTransaction,
        page,
        limit,
        where: { product_id: id },
        include: [{
          model: db.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name']
        }],
        order: [['created_at', 'DESC']]
      });
      
      res.status(200).json({
        status: 'success',
        count,
        totalPages,
        currentPage,
        data: {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku
          },
          transactions: rows
        }
      });
    } catch (error) {
      next(new AppError(`Error retrieving inventory history: ${error.message}`, 500));
    }
  },

  /**
   * Get low stock products
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  getLowStockProducts: async (req, res, next) => {
    try {
      const { threshold = 10 } = req.query;
      
      const lowStockProducts = await db.Inventory.findAll({
        where: db.sequelize.literal('stock_quantity <= COALESCE(reorder_level, :threshold)'),
        replacements: { threshold },
        include: [{
          model: db.Product,
          as: 'product',
          attributes: ['id', 'name', 'sku', 'image_url', 'selling_price'],
          include: [{
            model: db.Category,
            as: 'category',
            attributes: ['id', 'name']
          }]
        }],
        order: [['stock_quantity', 'ASC']]
      });
      
      res.status(200).json({
        status: 'success',
        count: lowStockProducts.length,
        data: lowStockProducts
      });
    } catch (error) {
      next(new AppError(`Error retrieving low stock products: ${error.message}`, 500));
    }
  },

  /**
   * Get inventory summary statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   */
  getInventorySummary: async (req, res, next) => {
    try {
      // Total products in inventory
      const totalProducts = await db.Inventory.count();
      
      // Total inventory items
      const totalItems = await db.sequelize.query(
        'SELECT SUM(stock_quantity) AS total FROM inventory',
        { type: db.sequelize.QueryTypes.SELECT }
      );
      
      // Low stock products
      const lowStockCount = await db.Inventory.count({
        where: db.sequelize.literal('stock_quantity <= COALESCE(reorder_level, 10)')
      });
      
      // Out of stock products
      const outOfStockCount = await db.Inventory.count({
        where: { stock_quantity: 0 }
      });
      
      // Total inventory value
      const inventoryValue = await db.sequelize.query(
        `SELECT SUM(p.selling_price * i.stock_quantity) AS total 
         FROM inventory i 
         JOIN products p ON i.product_id = p.id`,
        { type: db.sequelize.QueryTypes.SELECT }
      );
      
      res.status(200).json({
        status: 'success',
        data: {
          total_products: totalProducts,
          total_items: totalItems[0]?.total || 0,
          low_stock: lowStockCount,
          out_of_stock: outOfStockCount,
          inventory_value: inventoryValue[0]?.total || 0
        }
      });
    } catch (error) {
      next(new AppError(`Error retrieving inventory summary: ${error.message}`, 500));
    }
  }
};

module.exports = InventoryController; 