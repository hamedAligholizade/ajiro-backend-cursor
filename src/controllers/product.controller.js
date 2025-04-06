const { AppError } = require('../middleware/errorHandler');
const db = require('../models');
const { Op } = require('sequelize');

/**
 * Get all products with pagination and filtering
 * @route GET /api/products
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Build query with filtering options
    const query = {
      attributes: [
        'id', 'name', 'sku', 'barcode', 'description', 
        'category_id', 'purchase_price', 'selling_price', 
        'discount_price', 'is_taxable', 'tax_rate', 
        'image_url', 'is_active', 'weight', 'weight_unit',
        'created_at', 'updated_at'
      ],
      include: [
        {
          model: db.Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: db.Inventory,
          as: 'inventory',
          attributes: ['stock_quantity', 'available_quantity', 'reserved_quantity']
        }
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    };

    // Add search filter if provided
    if (req.query.search) {
      query.where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${req.query.search}%` } },
          { sku: { [Op.iLike]: `%${req.query.search}%` } },
          { barcode: { [Op.iLike]: `%${req.query.search}%` } },
          { description: { [Op.iLike]: `%${req.query.search}%` } }
        ]
      };
    }

    // Add category filter if provided
    if (req.query.category_id) {
      query.where = {
        ...query.where,
        category_id: req.query.category_id
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

    // Add price range filter if provided
    if (req.query.min_price || req.query.max_price) {
      const priceFilter = {};
      
      if (req.query.min_price) {
        priceFilter[Op.gte] = parseFloat(req.query.min_price);
      }
      
      if (req.query.max_price) {
        priceFilter[Op.lte] = parseFloat(req.query.max_price);
      }
      
      query.where = {
        ...query.where,
        selling_price: priceFilter
      };
    }

    // Add stock status filter if provided
    if (req.query.in_stock !== undefined) {
      const inStock = req.query.in_stock === 'true';
      
      if (inStock) {
        query.include[1].where = {
          available_quantity: {
            [Op.gt]: 0
          }
        };
      } else {
        query.include[1].where = {
          available_quantity: 0
        };
      }
    }

    const { count, rows: products } = await db.Product.findAndCountAll(query);

    res.status(200).json({
      success: true,
      data: {
        products,
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
 * Get product by ID
 * @route GET /api/products/:id
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await db.Product.findByPk(req.params.id, {
      include: [
        {
          model: db.Category,
          as: 'category',
          attributes: ['id', 'name', 'description']
        },
        {
          model: db.Inventory,
          as: 'inventory',
          attributes: [
            'id', 'stock_quantity', 'available_quantity', 'reserved_quantity',
            'reorder_level', 'reorder_quantity', 'location', 'updated_at'
          ]
        },
        {
          model: db.InventoryTransaction,
          as: 'inventory_transactions',
          limit: 10,
          order: [['created_at', 'DESC']],
          attributes: ['id', 'quantity', 'transaction_type', 'created_at', 'note']
        }
      ]
    });

    if (!product) {
      return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new product
 * @route POST /api/products
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { 
      name, sku, barcode, description, category_id, purchase_price,
      selling_price, discount_price, is_taxable, tax_rate, image_url,
      is_active, weight, weight_unit, stock_quantity, reorder_level,
      reorder_quantity, location, shop_id
    } = req.body;

    // Ensure shop_id is set (either from body or from request shop context)
    const productShopId = shop_id || (req.shop && req.shop.id);
    
    if (!productShopId) {
      return next(new AppError('Shop ID is required', 400, 'SHOP_ID_REQUIRED'));
    }

    // Check if sku already exists
    if (sku) {
      const existingProduct = await db.Product.findOne({ where: { sku } });
      if (existingProduct) {
        return next(new AppError('SKU already in use by another product', 400, 'SKU_IN_USE'));
      }
    }

    // Check if barcode already exists
    if (barcode) {
      const existingProduct = await db.Product.findOne({ where: { barcode } });
      if (existingProduct) {
        return next(new AppError('Barcode already in use by another product', 400, 'BARCODE_IN_USE'));
      }
    }

    // Check if category exists
    const category = await db.Category.findByPk(category_id);
    if (!category) {
      return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
    }

    // Start transaction
    const result = await db.sequelize.transaction(async (t) => {
      // Create product
      const product = await db.Product.create({
        name,
        sku,
        barcode,
        description,
        category_id,
        shop_id: productShopId,
        purchase_price,
        selling_price,
        discount_price,
        is_taxable,
        tax_rate,
        image_url,
        is_active: is_active !== undefined ? is_active : true,
        weight,
        weight_unit
      }, { transaction: t });

      // Create inventory record
      const inventoryQuantity = stock_quantity || 0;
      await db.Inventory.create({
        product_id: product.id,
        shop_id: productShopId,
        stock_quantity: inventoryQuantity,
        available_quantity: inventoryQuantity,
        reserved_quantity: 0,
        reorder_level,
        reorder_quantity,
        location
      }, { transaction: t });

      // Create inventory transaction if initial stock is > 0
      if (inventoryQuantity > 0) {
        await db.InventoryTransaction.create({
          product_id: product.id,
          shop_id: productShopId,
          quantity: inventoryQuantity,
          transaction_type: 'purchase',
          note: 'Initial stock',
          user_id: req.user.id
        }, { transaction: t });
      }

      return product;
    });

    // Fetch the created product with associated data
    const product = await db.Product.findByPk(result.id, {
      include: [
        {
          model: db.Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: db.Inventory,
          as: 'inventory',
          attributes: ['stock_quantity', 'available_quantity', 'reserved_quantity']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: {
        product
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product
 * @route PUT /api/products/:id
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { 
      name, sku, barcode, description, category_id, purchase_price,
      selling_price, discount_price, is_taxable, tax_rate, image_url,
      is_active, weight, weight_unit
    } = req.body;

    const productId = req.params.id;

    // Check if product exists
    const product = await db.Product.findByPk(productId);
    if (!product) {
      return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
    }

    // Check if sku is changed and already exists
    if (sku && sku !== product.sku) {
      const existingProduct = await db.Product.findOne({ where: { sku } });
      if (existingProduct) {
        return next(new AppError('SKU already in use by another product', 400, 'SKU_IN_USE'));
      }
    }

    // Check if barcode is changed and already exists
    if (barcode && barcode !== product.barcode) {
      const existingProduct = await db.Product.findOne({ where: { barcode } });
      if (existingProduct) {
        return next(new AppError('Barcode already in use by another product', 400, 'BARCODE_IN_USE'));
      }
    }

    // Check if category exists if provided
    if (category_id) {
      const category = await db.Category.findByPk(category_id);
      if (!category) {
        return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
      }
    }

    // Update product
    await product.update({
      name: name || product.name,
      sku: sku || product.sku,
      barcode: barcode || product.barcode,
      description: description !== undefined ? description : product.description,
      category_id: category_id || product.category_id,
      purchase_price: purchase_price !== undefined ? purchase_price : product.purchase_price,
      selling_price: selling_price || product.selling_price,
      discount_price: discount_price !== undefined ? discount_price : product.discount_price,
      is_taxable: is_taxable !== undefined ? is_taxable : product.is_taxable,
      tax_rate: tax_rate !== undefined ? tax_rate : product.tax_rate,
      image_url: image_url !== undefined ? image_url : product.image_url,
      is_active: is_active !== undefined ? is_active : product.is_active,
      weight: weight !== undefined ? weight : product.weight,
      weight_unit: weight_unit !== undefined ? weight_unit : product.weight_unit
    });

    // Fetch the updated product with associated data
    const updatedProduct = await db.Product.findByPk(productId, {
      include: [
        {
          model: db.Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: db.Inventory,
          as: 'inventory',
          attributes: ['stock_quantity', 'available_quantity', 'reserved_quantity']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        product: updatedProduct
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete product
 * @route DELETE /api/products/:id
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const productId = req.params.id;

    // Check if product exists
    const product = await db.Product.findByPk(productId);
    if (!product) {
      return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
    }

    // Check if product is used in any sales
    const salesWithProduct = await db.SaleItem.count({
      where: { product_id: productId }
    });

    if (salesWithProduct > 0) {
      // Soft delete (deactivate) the product instead of hard delete
      await product.update({ is_active: false });
      
      return res.status(200).json({
        success: true,
        message: 'Product has been deactivated because it is associated with sales'
      });
    }

    // Hard delete if not used in sales
    await product.destroy();

    res.status(200).json({
      success: true,
      message: 'Product successfully deleted'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update product inventory
 * @route PATCH /api/products/:id/inventory
 */
exports.updateInventory = async (req, res, next) => {
  try {
    const { 
      stock_quantity, available_quantity, reserved_quantity,
      reorder_level, reorder_quantity, location, adjustment_reason
    } = req.body;

    const productId = req.params.id;
    // Get shop_id from request context or body
    const shopId = req.shop?.id || req.body.shop_id;

    if (!shopId) {
      return next(new AppError('Shop ID is required', 400, 'SHOP_ID_REQUIRED'));
    }

    // Check if product exists
    const product = await db.Product.findByPk(productId);
    if (!product) {
      return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
    }

    // Find or create inventory
    const [inventory] = await db.Inventory.findOrCreate({
      where: { product_id: productId },
      defaults: {
        product_id: productId,
        shop_id: shopId, // Add shop_id to defaults
        stock_quantity: 0,
        available_quantity: 0,
        reserved_quantity: 0
      }
    });

    // Get original quantities for comparison
    const originalStock = inventory.stock_quantity;

    // Start transaction for atomicity
    await db.sequelize.transaction(async (t) => {
      // Update inventory
      await inventory.update({
        stock_quantity: stock_quantity !== undefined ? stock_quantity : inventory.stock_quantity,
        available_quantity: available_quantity !== undefined ? available_quantity : inventory.available_quantity,
        reserved_quantity: reserved_quantity !== undefined ? reserved_quantity : inventory.reserved_quantity,
        reorder_level: reorder_level !== undefined ? reorder_level : inventory.reorder_level,
        reorder_quantity: reorder_quantity !== undefined ? reorder_quantity : inventory.reorder_quantity,
        location: location !== undefined ? location : inventory.location
      }, { transaction: t });

      // If stock quantity changed, create an inventory transaction
      if (stock_quantity !== undefined && stock_quantity !== originalStock) {
        const change = stock_quantity - originalStock;
        
        await db.InventoryTransaction.create({
          product_id: productId,
          quantity: change,
          transaction_type: 'adjustment',
          note: adjustment_reason || 'Manual inventory adjustment',
          user_id: req.user.id
        }, { transaction: t });
      }
    });

    // Get updated inventory with product
    const updatedInventory = await db.Inventory.findOne({
      where: { product_id: productId },
      include: [{
        model: db.Product,
        as: 'product',
        attributes: ['id', 'name', 'sku']
      }]
    });

    res.status(200).json({
      success: true,
      data: {
        inventory: updatedInventory
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product inventory history
 * @route GET /api/products/:id/inventory-history
 */
exports.getInventoryHistory = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;

    // Check if product exists
    const product = await db.Product.findByPk(productId);
    if (!product) {
      return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
    }

    // Get inventory transactions
    const { count, rows: transactions } = await db.InventoryTransaction.findAndCountAll({
      where: { product_id: productId },
      include: [{
        model: db.User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name']
      }],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku
        },
        transactions,
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
 * Get low stock products
 * @route GET /api/products/low-stock
 */
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await db.Product.findAll({
      where: {
        is_active: true
      },
      include: [{
        model: db.Inventory,
        as: 'inventory',
        where: db.sequelize.literal('inventory.stock_quantity <= inventory.reorder_level AND inventory.reorder_level > 0')
      }, {
        model: db.Category,
        as: 'category',
        attributes: ['id', 'name']
      }],
      order: [
        [db.sequelize.literal('(inventory.stock_quantity / NULLIF(inventory.reorder_level, 0))'), 'ASC']
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        products
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product sales statistics
 * @route GET /api/products/:id/sales-stats
 */
exports.getProductSalesStats = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const days = parseInt(req.query.days, 10) || 30;

    // Check if product exists
    const product = await db.Product.findByPk(productId);
    if (!product) {
      return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get sales statistics
    const salesStats = await db.SaleItem.findAll({
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'total_quantity'],
        [db.sequelize.fn('SUM', db.sequelize.col('total')), 'total_revenue']
      ],
      include: [{
        model: db.Sale,
        as: 'sale',
        attributes: [],
        where: {
          sale_date: {
            [Op.between]: [startDate, endDate]
          },
          payment_status: {
            [Op.not]: 'refunded'
          }
        },
        required: true
      }],
      where: {
        product_id: productId
      }
    });

    // Get daily sales for chart
    const dailySales = await db.SaleItem.findAll({
      attributes: [
        [db.sequelize.fn('date_trunc', 'day', db.sequelize.col('sale.sale_date')), 'date'],
        [db.sequelize.fn('SUM', db.sequelize.col('quantity')), 'quantity'],
        [db.sequelize.fn('SUM', db.sequelize.col('total')), 'revenue']
      ],
      include: [{
        model: db.Sale,
        as: 'sale',
        attributes: [],
        where: {
          sale_date: {
            [Op.between]: [startDate, endDate]
          },
          payment_status: {
            [Op.not]: 'refunded'
          }
        },
        required: true
      }],
      where: {
        product_id: productId
      },
      group: [db.sequelize.fn('date_trunc', 'day', db.sequelize.col('sale.sale_date'))],
      order: [db.sequelize.literal('date ASC')]
    });

    res.status(200).json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku
        },
        summary: {
          total_quantity: salesStats[0].dataValues.total_quantity || 0,
          total_revenue: salesStats[0].dataValues.total_revenue || 0,
          period_days: days
        },
        daily_sales: dailySales
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Adjust product stock quantity
 * @route POST /api/products/:id/adjust-stock
 */
exports.adjustStock = async (req, res, next) => {
  try {
    const { quantity, note } = req.body;
    const productId = req.params.id;
    // Get shop_id from request context or body
    const shopId = req.shop?.id || req.body.shop_id;

    if (!shopId) {
      return next(new AppError('Shop ID is required', 400, 'SHOP_ID_REQUIRED'));
    }

    // Validate quantity
    if (!quantity || isNaN(parseInt(quantity))) {
      return next(new AppError('Quantity must be a valid number', 400, 'INVALID_QUANTITY'));
    }
    
    const adjustQuantity = parseInt(quantity);

    // Get product
    const product = await db.Product.findByPk(productId);
    if (!product) {
      return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
    }

    // Start transaction
    const result = await db.sequelize.transaction(async (t) => {
      // Find or create inventory
      let [inventory] = await db.Inventory.findOrCreate({
        where: { product_id: productId },
        defaults: {
          product_id: productId,
          shop_id: shopId, // Add shop_id here
          stock_quantity: 0,
          available_quantity: 0,
          reserved_quantity: 0
        },
        transaction: t
      });
      
      // Update quantities
      const newStockQuantity = inventory.stock_quantity + adjustQuantity;
      const newAvailableQuantity = inventory.available_quantity + adjustQuantity;
      
      // Don't allow negative stock (unless it's a return/adjustment)
      if (newStockQuantity < 0 || newAvailableQuantity < 0) {
        throw new AppError('Insufficient stock for adjustment', 400, 'INSUFFICIENT_STOCK');
      }
      
      // Update inventory
      await inventory.update({
        stock_quantity: newStockQuantity,
        available_quantity: newAvailableQuantity
      }, { transaction: t });
      
      // Create inventory transaction record
      await db.InventoryTransaction.create({
        product_id: productId,
        shop_id: shopId, // Add shop_id here too
        quantity: adjustQuantity,
        transaction_type: adjustQuantity > 0 ? 'adjustment_in' : 'adjustment_out',
        note: note || 'Manual stock adjustment',
        user_id: req.user.id
      }, { transaction: t });
      
      return inventory;
    });

    // Get updated inventory with product
    const updatedInventory = await db.Inventory.findOne({
      where: { product_id: productId },
      include: [{
        model: db.Product,
        as: 'product',
        attributes: ['id', 'name', 'sku']
      }]
    });

    res.status(200).json({
      success: true,
      data: {
        inventory: updatedInventory
      }
    });
  } catch (error) {
    next(error);
  }
}; 