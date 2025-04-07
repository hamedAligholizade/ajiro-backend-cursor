const { AppError } = require('../middleware/errorHandler');
const db = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Get all orders with pagination and filtering
 * @route GET /api/orders
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // Build query with filtering options
    const query = {
      attributes: [
        'id', 'order_number', 'customer_id', 'status', 'order_date',
        'total_amount', 'payment_status', 'shipping_address', 
        'shipping_method', 'tracking_number', 'notes',
        'created_at', 'updated_at'
      ],
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        }
      ],
      limit,
      offset,
      order: [['order_date', 'DESC']]
    };
    
    // Add filters based on query parameters
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.customer_id) {
      filter.customer_id = req.query.customer_id;
    }
    
    if (req.query.start_date || req.query.end_date) {
      const dateFilter = {};
      
      if (req.query.start_date) {
        dateFilter[Op.gte] = new Date(req.query.start_date);
      }
      
      if (req.query.end_date) {
        // Set the end date to the end of the day
        const endDate = new Date(req.query.end_date);
        endDate.setHours(23, 59, 59, 999);
        dateFilter[Op.lte] = endDate;
      }
      
      filter.order_date = dateFilter;
    }
    
    if (Object.keys(filter).length > 0) {
      query.where = filter;
    }
    
    const { count, rows: orders } = await db.Order.findAndCountAll(query);
    
    res.status(200).json({
      success: true,
      data: {
        orders,
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
 * Get order by ID
 * @route GET /api/orders/:id
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await db.Order.findByPk(req.params.id, {
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        },
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'barcode', 'image_url']
            }
          ]
        },
        {
          model: db.OrderStatusHistory,
          as: 'status_history',
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['id', 'first_name', 'last_name', 'email']
            }
          ]
        }
      ]
    });
    
    if (!order) {
      return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
    }
    
    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new order
 * @route POST /api/orders
 */
exports.createOrder = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { 
      customer_id, 
      shop_id, 
      shipping_address, 
      shipping_method, 
      items, 
      notes, 
      payment_method,
      status = 'pending' 
    } = req.body;
    
    // Validate required shop_id
    if (!shop_id) {
      await transaction.rollback();
      return next(new AppError('Shop ID is required' + JSON.stringify(req.body), 400, 'SHOP_ID_REQUIRED'));
    }
    
    // Check if shop exists
    const shop = await db.Shop.findByPk(shop_id);
    if (!shop) {
      await transaction.rollback();
      return next(new AppError('Shop not found', 404, 'SHOP_NOT_FOUND'));
    }
    
    // Check if customer exists
    let customer = null;
    if (customer_id) {
      customer = await db.Customer.findByPk(customer_id);
      if (!customer) {
        await transaction.rollback();
        return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
      }
    }
    
    // Check if products exist and have enough stock
    const productIds = items.map(item => item.product_id);
    const products = await db.Product.findAll({
      where: { id: { [Op.in]: productIds } },
      include: [
        {
          model: db.Inventory,
          as: 'inventory'
        }
      ]
    });
    
    if (products.length !== productIds.length) {
      await transaction.rollback();
      return next(new AppError('One or more products not found', 404, 'PRODUCT_NOT_FOUND'));
    }
    
    // Check inventory
    const productsMap = products.reduce((map, product) => {
      map[product.id] = product;
      return map;
    }, {});
    
    for (const item of items) {
      const product = productsMap[item.product_id];
      if (!product.inventory || product.inventory.available_quantity < item.quantity) {
        await transaction.rollback();
        return next(new AppError(
          `Insufficient stock for product: ${product.name}`,
          400,
          'INSUFFICIENT_STOCK'
        ));
      }
    }
    
    // Calculate order total
    let totalAmount = 0;
    for (const item of items) {
      const product = productsMap[item.product_id];
      totalAmount += parseFloat(product.selling_price) * item.quantity;
    }
    
    // Generate unique order number
    const timestamp = Date.now().toString().substring(4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const order_number = `ORD-${timestamp}-${random}`;
    
    // Create order
    const order = await db.Order.create({
      customer_id,
      shop_id,
      shipping_address,
      shipping_method,
      notes,
      total_amount: totalAmount,
      status: status || 'pending',
      payment_status: 'pending',
      payment_method: payment_method || 'cash',
      order_date: new Date(),
      order_number
    }, { transaction });
    
    // Create order items
    const orderItems = [];
    for (const item of items) {
      const product = productsMap[item.product_id];
      const orderItem = await db.OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.selling_price,
        total_price: parseFloat(product.selling_price) * item.quantity
      }, { transaction });
      
      orderItems.push(orderItem);
      
      // Update inventory
      await db.Inventory.update(
        {
          available_quantity: db.sequelize.literal(`available_quantity - ${item.quantity}`),
          reserved_quantity: db.sequelize.literal(`reserved_quantity + ${item.quantity}`)
        },
        {
          where: { product_id: item.product_id },
          transaction
        }
      );
      
      // Create inventory transaction
      await db.InventoryTransaction.create({
        product_id: item.product_id,
        quantity: -item.quantity,
        transaction_type: 'sale',
        reference_id: order.id,
        note: `Reserved for order ${order.order_number}`,
        user_id: req.user.id
      }, { transaction });
    }
    
    // Create initial order status history
    await db.OrderStatusHistory.create({
      order_id: order.id,
      status: 'pending',
      note: 'Order created',
      user_id: req.user.id
    }, { 
      transaction,
      paranoid: false
    });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      data: {
        order: {
          ...order.toJSON(),
          items: orderItems
        }
      },
      message: `Order created with order number: ${order.order_number}`
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Update order
 * @route PUT /api/orders/:id
 */
exports.updateOrder = async (req, res, next) => {
  try {
    const { shipping_address, shipping_method, notes } = req.body;
    
    const order = await db.Order.findByPk(req.params.id);
    
    if (!order) {
      return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
    }
    
    // Check if order can be updated
    if (order.status !== 'pending') {
      return next(new AppError(
        'Cannot update order that has been processed',
        400,
        'ORDER_ALREADY_PROCESSED'
      ));
    }
    
    await order.update({
      shipping_address,
      shipping_method,
      notes
    });
    
    res.status(200).json({
      success: true,
      data: { order },
      message: 'Order updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update order status
 * @route PATCH /api/orders/:id/status
 */
exports.updateOrderStatus = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { status, note } = req.body;
    
    const order = await db.Order.findByPk(req.params.id, {
      include: [
        {
          model: db.OrderItem,
          as: 'items'
        }
      ]
    });
    
    if (!order) {
      await transaction.rollback();
      return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
    }
    
    // Validate status transition
    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: []
    };
    
    if (!validTransitions[order.status].includes(status)) {
      await transaction.rollback();
      return next(new AppError(
        `Invalid status transition from ${order.status} to ${status}`,
        400,
        'INVALID_STATUS_TRANSITION'
      ));
    }
    
    // Handle special cases
    if (status === 'cancelled' && ['pending', 'processing', 'shipped'].includes(order.status)) {
      // Return reserved items to available inventory
      for (const item of order.items) {
        await db.Inventory.update(
          {
            available_quantity: db.sequelize.literal(`available_quantity + ${item.quantity}`),
            reserved_quantity: db.sequelize.literal(`reserved_quantity - ${item.quantity}`)
          },
          {
            where: { product_id: item.product_id },
            transaction
          }
        );
        
        // Create inventory transaction
        await db.InventoryTransaction.create({
          product_id: item.product_id,
          quantity: item.quantity,
          transaction_type: 'adjustment',
          reference_id: order.id,
          note: `Order ${order.order_number} cancelled`,
          user_id: req.user.id
        }, { transaction });
      }
    } else if (status === 'processing' && order.status === 'pending') {
      // No inventory changes needed, just status update
      
      // Log event for audit purposes
      logger.info(`Order ${order.order_number} moved to processing status`, {
        orderId: order.id,
        userId: req.user.id
      });
    } else if (status === 'shipped' && order.status === 'processing') {
      // Move from reserved to consumed (reserved quantity is reduced, but stock remains unchanged)
      for (const item of order.items) {
        await db.Inventory.update(
          {
            reserved_quantity: db.sequelize.literal(`reserved_quantity - ${item.quantity}`)
          },
          {
            where: { product_id: item.product_id },
            transaction
          }
        );
        
        // Create inventory transaction
        await db.InventoryTransaction.create({
          product_id: item.product_id,
          quantity: -item.quantity,
          transaction_type: 'sale',
          reference_id: order.id,
          note: `Order ${order.order_number} shipped`,
          user_id: req.user.id
        }, { transaction });
      }
    } else if (status === 'delivered' && order.status === 'shipped') {
      // Delivery completed - finalize the sale
      // No inventory changes needed at this point since the stock has already been removed
      // from reserved_quantity during shipping
      
      // Record delivery time
      await order.update({ 
        delivery_date: new Date() 
      }, { transaction });
      
      // Create inventory transaction for audit purposes
      for (const item of order.items) {
        await db.InventoryTransaction.create({
          product_id: item.product_id,
          quantity: 0, // No quantity change, just for tracking
          transaction_type: 'delivery',
          reference_id: order.id,
          note: `Order ${order.order_number} delivered to customer`,
          user_id: req.user.id
        }, { transaction });
      }
      
      // If order is not yet paid, update payment status
      if (order.payment_status === 'pending') {
        await order.update({ 
          payment_status: 'paid'
        }, { transaction });
      }
    }
    
    // Update order status
    await order.update({ status }, { transaction });
    
    // Create status history record
    await db.OrderStatusHistory.create({
      order_id: order.id,
      status,
      note: note || `Status changed to ${status}`,
      user_id: req.user.id
    }, { transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      data: { order },
      message: `Order status updated to ${status}`
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Delete order
 * @route DELETE /api/orders/:id
 */
exports.deleteOrder = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const order = await db.Order.findByPk(req.params.id, {
      include: [
        {
          model: db.OrderItem,
          as: 'items'
        }
      ]
    });
    
    if (!order) {
      await transaction.rollback();
      return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
    }
    
    // Check if order can be deleted
    if (order.status !== 'pending') {
      await transaction.rollback();
      return next(new AppError(
        'Cannot delete order that has been processed',
        400,
        'ORDER_ALREADY_PROCESSED'
      ));
    }
    
    // Return reserved items to inventory
    for (const item of order.items) {
      await db.Inventory.update(
        {
          available_quantity: db.sequelize.literal(`available_quantity + ${item.quantity}`),
          reserved_quantity: db.sequelize.literal(`reserved_quantity - ${item.quantity}`)
        },
        {
          where: { product_id: item.product_id },
          transaction
        }
      );
      
      // Create inventory transaction
      await db.InventoryTransaction.create({
        product_id: item.product_id,
        quantity: item.quantity,
        transaction_type: 'adjustment',
        reference_id: order.id,
        note: `Order ${order.order_number} deleted`,
        user_id: req.user.id
      }, { transaction });
      
      // Delete order item
      await item.destroy({ transaction });
    }
    
    // Delete status history
    await db.OrderStatusHistory.destroy({
      where: { order_id: order.id },
      transaction
    });
    
    // Delete order
    await order.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Get customer's orders
 * @route GET /api/orders/customer/:id
 */
exports.getCustomerOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows: orders } = await db.Order.findAndCountAll({
      where: { customer_id: req.params.id },
      attributes: [
        'id', 'order_number', 'status', 'order_date',
        'total_amount', 'payment_status', 'shipping_method',
        'tracking_number', 'created_at', 'updated_at'
      ],
      include: [
        {
          model: db.OrderItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'name', 'image_url']
            }
          ]
        }
      ],
      limit,
      offset,
      order: [['order_date', 'DESC']]
    });
    
    res.status(200).json({
      success: true,
      data: {
        orders,
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
 * Add item to order
 * @route POST /api/orders/:id/items
 */
exports.addOrderItem = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { product_id, quantity } = req.body;
    
    const order = await db.Order.findByPk(req.params.id);
    
    if (!order) {
      await transaction.rollback();
      return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
    }
    
    // Check if order can be modified
    if (order.status !== 'pending') {
      await transaction.rollback();
      return next(new AppError(
        'Cannot modify order that has been processed',
        400,
        'ORDER_ALREADY_PROCESSED'
      ));
    }
    
    // Check if product exists
    const product = await db.Product.findByPk(product_id, {
      include: [
        {
          model: db.Inventory,
          as: 'inventory'
        }
      ]
    });
    
    if (!product) {
      await transaction.rollback();
      return next(new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND'));
    }
    
    // Check inventory
    if (!product.inventory || product.inventory.available_quantity < quantity) {
      await transaction.rollback();
      return next(new AppError(
        `Insufficient stock for product: ${product.name}`,
        400,
        'INSUFFICIENT_STOCK'
      ));
    }
    
    // Check if item already exists in order
    const existingItem = await db.OrderItem.findOne({
      where: {
        order_id: order.id,
        product_id
      }
    });
    
    if (existingItem) {
      await transaction.rollback();
      return next(new AppError(
        'Item already exists in order. Use update endpoint to modify quantity.',
        400,
        'ITEM_ALREADY_EXISTS'
      ));
    }
    
    // Create order item
    const orderItem = await db.OrderItem.create({
      order_id: order.id,
      product_id,
      quantity,
      unit_price: product.selling_price,
      total_price: parseFloat(product.selling_price) * quantity
    }, { transaction });
    
    // Update inventory
    await db.Inventory.update(
      {
        available_quantity: db.sequelize.literal(`available_quantity - ${quantity}`),
        reserved_quantity: db.sequelize.literal(`reserved_quantity + ${quantity}`)
      },
      {
        where: { product_id },
        transaction
      }
    );
    
    // Create inventory transaction
    await db.InventoryTransaction.create({
      product_id,
      quantity: -quantity,
      transaction_type: 'sale',
      reference_id: order.id,
      note: `Reserved for order ${order.order_number}`,
      user_id: req.user.id
    }, { transaction });
    
    // Update order total
    const orderItems = await db.OrderItem.findAll({
      where: { order_id: order.id }
    });
    
    const newTotal = orderItems.reduce((total, item) => {
      return total + parseFloat(item.total_price);
    }, parseFloat(orderItem.total_price));
    
    await order.update({
      total_amount: newTotal
    }, { transaction });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      data: {
        orderItem,
        order: {
          ...order.toJSON(),
          total_amount: newTotal
        }
      },
      message: 'Item added to order'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Update order item
 * @route PUT /api/orders/:id/items/:itemId
 */
exports.updateOrderItem = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const { quantity } = req.body;
    
    const order = await db.Order.findByPk(req.params.id);
    
    if (!order) {
      await transaction.rollback();
      return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
    }
    
    // Check if order can be modified
    if (order.status !== 'pending') {
      await transaction.rollback();
      return next(new AppError(
        'Cannot modify order that has been processed',
        400,
        'ORDER_ALREADY_PROCESSED'
      ));
    }
    
    // Get order item
    const orderItem = await db.OrderItem.findOne({
      where: {
        id: req.params.itemId,
        order_id: order.id
      }
    });
    
    if (!orderItem) {
      await transaction.rollback();
      return next(new AppError('Order item not found', 404, 'ITEM_NOT_FOUND'));
    }
    
    // Calculate quantity difference
    const quantityDiff = quantity - orderItem.quantity;
    
    if (quantityDiff !== 0) {
      // Get product and inventory
      const product = await db.Product.findByPk(orderItem.product_id, {
        include: [
          {
            model: db.Inventory,
            as: 'inventory'
          }
        ]
      });
      
      // Check inventory if increasing quantity
      if (quantityDiff > 0 && 
          (!product.inventory || product.inventory.available_quantity < quantityDiff)) {
        await transaction.rollback();
        return next(new AppError(
          `Insufficient stock for product: ${product.name}`,
          400,
          'INSUFFICIENT_STOCK'
        ));
      }
      
      // Update inventory
      await db.Inventory.update(
        {
          available_quantity: db.sequelize.literal(`available_quantity - ${quantityDiff}`),
          reserved_quantity: db.sequelize.literal(`reserved_quantity + ${quantityDiff}`)
        },
        {
          where: { product_id: orderItem.product_id },
          transaction
        }
      );
      
      // Create inventory transaction
      await db.InventoryTransaction.create({
        product_id: orderItem.product_id,
        quantity: -quantityDiff,
        transaction_type: 'adjustment',
        reference_id: order.id,
        note: `Updated quantity for order ${order.order_number}`,
        user_id: req.user.id
      }, { transaction });
    }
    
    // Update order item
    const oldTotal = parseFloat(orderItem.total_price);
    const newTotal = parseFloat(orderItem.unit_price) * quantity;
    
    await orderItem.update({
      quantity,
      total_price: newTotal
    }, { transaction });
    
    // Update order total
    await order.update({
      total_amount: db.sequelize.literal(`total_amount - ${oldTotal} + ${newTotal}`)
    }, { transaction });
    
    await transaction.commit();
    
    // Reload order to get updated values
    await order.reload();
    
    res.status(200).json({
      success: true,
      data: {
        orderItem,
        order
      },
      message: 'Order item updated'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

/**
 * Remove item from order
 * @route DELETE /api/orders/:id/items/:itemId
 */
exports.removeOrderItem = async (req, res, next) => {
  const transaction = await db.sequelize.transaction();
  
  try {
    const order = await db.Order.findByPk(req.params.id);
    
    if (!order) {
      await transaction.rollback();
      return next(new AppError('Order not found', 404, 'ORDER_NOT_FOUND'));
    }
    
    // Check if order can be modified
    if (order.status !== 'pending') {
      await transaction.rollback();
      return next(new AppError(
        'Cannot modify order that has been processed',
        400,
        'ORDER_ALREADY_PROCESSED'
      ));
    }
    
    // Get order item
    const orderItem = await db.OrderItem.findOne({
      where: {
        id: req.params.itemId,
        order_id: order.id
      }
    });
    
    if (!orderItem) {
      await transaction.rollback();
      return next(new AppError('Order item not found', 404, 'ITEM_NOT_FOUND'));
    }
    
    // Update inventory
    await db.Inventory.update(
      {
        available_quantity: db.sequelize.literal(`available_quantity + ${orderItem.quantity}`),
        reserved_quantity: db.sequelize.literal(`reserved_quantity - ${orderItem.quantity}`)
      },
      {
        where: { product_id: orderItem.product_id },
        transaction
      }
    );
    
    // Create inventory transaction
    await db.InventoryTransaction.create({
      product_id: orderItem.product_id,
      quantity: orderItem.quantity,
      transaction_type: 'adjustment',
      reference_id: order.id,
      note: `Removed from order ${order.order_number}`,
      user_id: req.user.id
    }, { transaction });
    
    // Update order total
    await order.update({
      total_amount: db.sequelize.literal(`total_amount - ${orderItem.total_price}`)
    }, { transaction });
    
    // Delete order item
    await orderItem.destroy({ transaction });
    
    await transaction.commit();
    
    // Reload order to get updated values
    await order.reload();
    
    res.status(200).json({
      success: true,
      data: { order },
      message: 'Item removed from order'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
}; 