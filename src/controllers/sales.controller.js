const { AppError } = require('../middleware/errorHandler');
const db = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all sales with pagination and filtering
 * @route GET /api/sales
 */
exports.getAllSales = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Build query with filtering options
    const query = {
      attributes: [
        'id', 'invoice_number', 'customer_id', 'user_id', 'sale_date',
        'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
        'payment_method', 'payment_status', 'notes',
        'loyalty_points_earned', 'loyalty_points_used',
        'created_at', 'updated_at'
      ],
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name']
        }
      ],
      limit,
      offset,
      order: [['sale_date', 'DESC']]
    };

    // Add date range filter if provided
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
      
      query.where = {
        ...query.where,
        sale_date: dateFilter
      };
    }

    // Add customer filter if provided
    if (req.query.customer_id) {
      query.where = {
        ...query.where,
        customer_id: req.query.customer_id
      };
    }

    // Add user filter if provided
    if (req.query.user_id) {
      query.where = {
        ...query.where,
        user_id: req.query.user_id
      };
    }

    // Add payment status filter if provided
    if (req.query.payment_status) {
      query.where = {
        ...query.where,
        payment_status: req.query.payment_status
      };
    }

    // Add payment method filter if provided
    if (req.query.payment_method) {
      query.where = {
        ...query.where,
        payment_method: req.query.payment_method
      };
    }

    // Add minimum amount filter if provided
    if (req.query.min_amount) {
      query.where = {
        ...query.where,
        total_amount: {
          ...query.where?.total_amount,
          [Op.gte]: parseFloat(req.query.min_amount)
        }
      };
    }

    // Add maximum amount filter if provided
    if (req.query.max_amount) {
      query.where = {
        ...query.where,
        total_amount: {
          ...query.where?.total_amount,
          [Op.lte]: parseFloat(req.query.max_amount)
        }
      };
    }

    // Add invoice number search if provided
    if (req.query.invoice_number) {
      query.where = {
        ...query.where,
        invoice_number: {
          [Op.iLike]: `%${req.query.invoice_number}%`
        }
      };
    }

    const { count, rows: sales } = await db.Sale.findAndCountAll(query);

    res.status(200).json({
      success: true,
      data: {
        sales,
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
 * Get sale by ID
 * @route GET /api/sales/:id
 */
exports.getSaleById = async (req, res, next) => {
  try {
    const sale = await db.Sale.findByPk(req.params.id, {
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'loyalty_points', 'loyalty_tier']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: db.SaleItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'name', 'sku', 'barcode']
            }
          ]
        },
        {
          model: db.Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'payment_method', 'payment_date', 'reference_number', 'status']
        },
        {
          model: db.Refund,
          as: 'refunds',
          attributes: ['id', 'amount', 'reason', 'refund_date', 'status']
        }
      ]
    });

    if (!sale) {
      return next(new AppError('Sale not found', 404, 'SALE_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: {
        sale
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new sale
 * @route POST /api/sales
 */
exports.createSale = async (req, res, next) => {
  try {
    const { 
      customer_id, 
      items, 
      payment_method, 
      notes, 
      discount_amount = 0, 
      loyalty_points_used = 0 
    } = req.body;

    // Validate customer if provided
    let customer = null;
    if (customer_id) {
      customer = await db.Customer.findByPk(customer_id);
      if (!customer) {
        return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
      }

      // Check if customer has enough loyalty points
      if (loyalty_points_used > 0 && customer.loyalty_points < loyalty_points_used) {
        return next(new AppError('Customer does not have enough loyalty points', 400, 'INSUFFICIENT_LOYALTY_POINTS'));
      }
    }

    // Validate items exist and have sufficient stock
    const validatedItems = [];
    let subtotal = 0;
    let total_tax = 0;

    // Use a transaction for atomicity
    await db.sequelize.transaction(async (t) => {
      // Process each item
      for (const item of items) {
        const { product_id, quantity, discount_percent = 0 } = item;

        // Check if product exists and is active
        const product = await db.Product.findOne({
          where: { 
            id: product_id, 
            is_active: true 
          },
          include: [
            {
              model: db.Inventory,
              as: 'inventory',
              attributes: ['available_quantity']
            }
          ],
          transaction: t
        });

        if (!product) {
          throw new AppError(`Product with ID ${product_id} not found or inactive`, 404, 'PRODUCT_NOT_FOUND');
        }

        // Check if there's enough inventory
        if (!product.inventory || product.inventory.available_quantity < quantity) {
          throw new AppError(`Insufficient stock for product: ${product.name}`, 400, 'INSUFFICIENT_STOCK');
        }

        // Calculate pricing
        const unit_price = product.selling_price;
        const item_subtotal = quantity * unit_price;
        
        // Calculate discount
        const discount_amount = (item_subtotal * discount_percent) / 100;
        
        // Calculate tax
        const taxable_amount = item_subtotal - discount_amount;
        const tax_percent = product.is_taxable ? (product.tax_rate || 0) : 0;
        const tax_amount = (taxable_amount * tax_percent) / 100;
        
        // Calculate total
        const total = taxable_amount + tax_amount;

        // Add to running totals
        subtotal += item_subtotal;
        total_tax += tax_amount;

        // Add validated item
        validatedItems.push({
          product_id,
          quantity,
          unit_price,
          discount_percent,
          discount_amount,
          tax_percent,
          tax_amount,
          subtotal: item_subtotal,
          total
        });
      }

      // Calculate total amount
      const total_amount = subtotal - discount_amount + total_tax;

      // Calculate loyalty points earned (simplified example: 1 point per $10 spent)
      const loyalty_points_earned = customer ? Math.floor(total_amount / 10) : 0;

      // Generate invoice number
      const prefix = 'INV';
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const invoice_number = `${prefix}-${date}-${random}`;

      // Create sale record
      const sale = await db.Sale.create({
        invoice_number,
        customer_id,
        user_id: req.user.id,
        sale_date: new Date(),
        subtotal,
        discount_amount,
        tax_amount: total_tax,
        total_amount,
        payment_method,
        payment_status: 'paid', // Assuming immediate payment for simplicity
        notes,
        loyalty_points_earned,
        loyalty_points_used
      }, { transaction: t });

      // Create sale items
      for (const item of validatedItems) {
        await db.SaleItem.create({
          ...item,
          sale_id: sale.id,
        }, { 
          transaction: t,
          user_id: req.user.id
        });
      }

      // Create payment record
      await db.Payment.create({
        sale_id: sale.id,
        amount: total_amount,
        payment_method,
        payment_date: new Date(),
        reference_number: uuidv4().substring(0, 8).toUpperCase(),
        status: 'completed',
        user_id: req.user.id
      }, { transaction: t });

      // Update customer's loyalty points if applicable
      if (customer) {
        const newPoints = customer.loyalty_points - loyalty_points_used + loyalty_points_earned;
        await customer.update({ loyalty_points: newPoints }, { transaction: t });

        // Record loyalty transaction for points used
        if (loyalty_points_used > 0) {
          await db.LoyaltyTransaction.create({
            customer_id,
            sale_id: sale.id,
            user_id: req.user.id,
            points: -loyalty_points_used,
            type: 'debit',
            description: `Points used for sale ${invoice_number}`
          }, { transaction: t });
        }

        // Record loyalty transaction for points earned
        if (loyalty_points_earned > 0) {
          await db.LoyaltyTransaction.create({
            customer_id,
            sale_id: sale.id,
            user_id: req.user.id,
            points: loyalty_points_earned,
            type: 'credit',
            description: `Points earned from sale ${invoice_number}`
          }, { transaction: t });
        }
      }

      return sale;
    });

    // Fetch the complete sale with all related data
    const completeSale = await db.Sale.findByPk(customer.id, {
      include: [
        {
          model: db.Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'loyalty_points']
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name']
        },
        {
          model: db.SaleItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product',
              attributes: ['id', 'name', 'sku']
            }
          ]
        },
        {
          model: db.Payment,
          as: 'payments',
          attributes: ['id', 'amount', 'payment_method', 'payment_date', 'reference_number', 'status']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: {
        sale: completeSale
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update sale payment status
 * @route PATCH /api/sales/:id/payment-status
 */
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { payment_status } = req.body;
    const saleId = req.params.id;

    // Check if sale exists
    const sale = await db.Sale.findByPk(saleId);
    if (!sale) {
      return next(new AppError('Sale not found', 404, 'SALE_NOT_FOUND'));
    }

    // Validate status transition
    const validTransitions = {
      'unpaid': ['paid', 'partial', 'cancelled'],
      'partial': ['paid', 'unpaid', 'cancelled'],
      'paid': ['refunded', 'partial'],
      'refunded': [],
      'cancelled': []
    };

    if (!validTransitions[sale.payment_status].includes(payment_status)) {
      return next(new AppError(`Cannot change payment status from ${sale.payment_status} to ${payment_status}`, 400, 'INVALID_STATUS_TRANSITION'));
    }

    // Update payment status
    await sale.update({ payment_status });

    res.status(200).json({
      success: true,
      data: {
        sale: {
          id: sale.id,
          invoice_number: sale.invoice_number,
          payment_status: sale.payment_status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process payment for a sale
 * @route POST /api/sales/:id/payments
 */
exports.processPayment = async (req, res, next) => {
  try {
    const { amount, payment_method, reference_number } = req.body;
    const saleId = req.params.id;

    // Check if sale exists
    const sale = await db.Sale.findByPk(saleId);
    if (!sale) {
      return next(new AppError('Sale not found', 404, 'SALE_NOT_FOUND'));
    }

    // Check if sale can receive payments
    if (['refunded', 'cancelled'].includes(sale.payment_status)) {
      return next(new AppError(`Cannot process payment for a ${sale.payment_status} sale`, 400, 'INVALID_PAYMENT_STATUS'));
    }

    // Calculate total payments already made
    const existingPayments = await db.Payment.findAll({
      where: {
        sale_id: saleId,
        status: 'completed'
      },
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total_paid']
      ],
      raw: true
    });

    const totalPaid = parseFloat(existingPayments[0].total_paid || 0);
    const remainingAmount = sale.total_amount - totalPaid;

    // Validate payment amount
    if (amount <= 0) {
      return next(new AppError('Payment amount must be greater than zero', 400, 'INVALID_PAYMENT_AMOUNT'));
    }

    if (amount > remainingAmount) {
      return next(new AppError(`Payment amount exceeds remaining balance of ${remainingAmount}`, 400, 'PAYMENT_EXCEEDS_BALANCE'));
    }

    // Create payment record
    const payment = await db.Payment.create({
      sale_id: saleId,
      amount,
      payment_method,
      payment_date: new Date(),
      reference_number: reference_number || uuidv4().substring(0, 8).toUpperCase(),
      status: 'completed',
      user_id: req.user.id
    });

    // Update sale payment status
    const newTotalPaid = totalPaid + amount;
    let newPaymentStatus;

    if (newTotalPaid >= sale.total_amount) {
      newPaymentStatus = 'paid';
    } else {
      newPaymentStatus = 'partial';
    }

    await sale.update({ payment_method, payment_status: newPaymentStatus });

    res.status(201).json({
      success: true,
      data: {
        payment,
        sale: {
          id: sale.id,
          invoice_number: sale.invoice_number,
          payment_status: newPaymentStatus,
          total_amount: sale.total_amount,
          amount_paid: newTotalPaid,
          balance: sale.total_amount - newTotalPaid
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Process refund for a sale
 * @route POST /api/sales/:id/refunds
 */
exports.processRefund = async (req, res, next) => {
  try {
    const { amount, reason, refund_method } = req.body;
    const saleId = req.params.id;

    // Check if sale exists
    const sale = await db.Sale.findByPk(saleId, {
      include: [
        {
          model: db.Customer,
          as: 'customer'
        },
        {
          model: db.SaleItem,
          as: 'items',
          include: [
            {
              model: db.Product,
              as: 'product'
            }
          ]
        }
      ]
    });

    if (!sale) {
      return next(new AppError('Sale not found', 404, 'SALE_NOT_FOUND'));
    }

    // Check if sale is eligible for refund
    if (sale.payment_status !== 'paid') {
      return next(new AppError(`Cannot refund a sale with payment status: ${sale.payment_status}`, 400, 'INELIGIBLE_FOR_REFUND'));
    }

    // Calculate total refunds already processed
    const existingRefunds = await db.Refund.findAll({
      where: {
        sale_id: saleId,
        status: 'completed'
      },
      attributes: [
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total_refunded']
      ],
      raw: true
    });

    const totalRefunded = parseFloat(existingRefunds[0].total_refunded || 0);
    const maxRefundAmount = sale.total_amount - totalRefunded;

    // Validate refund amount
    if (amount <= 0) {
      return next(new AppError('Refund amount must be greater than zero', 400, 'INVALID_REFUND_AMOUNT'));
    }

    if (amount > maxRefundAmount) {
      return next(new AppError(`Refund amount exceeds maximum allowed refund of ${maxRefundAmount}`, 400, 'REFUND_EXCEEDS_LIMIT'));
    }

    // Start a transaction
    await db.sequelize.transaction(async (t) => {
      // Create refund record
      const refund = await db.Refund.create({
        sale_id: saleId,
        amount,
        reason,
        refund_method: refund_method || sale.payment_method,
        refund_date: new Date(),
        status: 'completed',
        user_id: req.user.id
      }, { transaction: t });

      // Update sale payment status if fully refunded
      const newTotalRefunded = totalRefunded + amount;
      if (newTotalRefunded >= sale.total_amount) {
        await sale.update({ payment_status: 'refunded' }, { transaction: t });
      }

      // Reverse loyalty points if applicable
      if (sale.customer && sale.loyalty_points_earned > 0) {
        // Calculate proportion of points to reverse
        const percentRefunded = amount / sale.total_amount;
        const pointsToReverse = Math.round(sale.loyalty_points_earned * percentRefunded);

        if (pointsToReverse > 0) {
          // Deduct points from customer
          await sale.customer.decrement('loyalty_points', { 
            by: pointsToReverse, 
            transaction: t 
          });

          // Record loyalty transaction
          await db.LoyaltyTransaction.create({
            customer_id: sale.customer.id,
            sale_id: saleId,
            user_id: req.user.id,
            points: -pointsToReverse,
            type: 'debit',
            description: `Points reversed due to refund on invoice ${sale.invoice_number}`
          }, { transaction: t });
        }
      }

      return refund;
    });

    // Fetch the updated sale
    const updatedSale = await db.Sale.findByPk(saleId, {
      attributes: ['id', 'invoice_number', 'payment_status', 'total_amount'],
      include: [
        {
          model: db.Refund,
          as: 'refunds',
          attributes: ['id', 'amount', 'refund_date', 'status']
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: {
        sale: updatedSale
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sales statistics
 * @route GET /api/sales/statistics
 */
exports.getSalesStatistics = async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    // Default to current month if no dates provided
    const startDate = start_date ? new Date(start_date) : new Date(new Date().setDate(1));
    
    // Set end date to end of today if not provided
    const endDate = end_date ? new Date(end_date + 'T23:59:59.999Z') : new Date(new Date().setHours(23, 59, 59, 999));
    
    // Get sales summary
    const salesSummary = await db.Sale.findAll({
      where: {
        sale_date: {
          [Op.between]: [startDate, endDate]
        },
        payment_status: {
          [Op.not]: 'cancelled'
        }
      },
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total_sales'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total_revenue'],
        [db.sequelize.fn('AVG', db.sequelize.col('total_amount')), 'average_sale_value'],
        [db.sequelize.fn('SUM', db.sequelize.col('tax_amount')), 'total_tax'],
        [db.sequelize.fn('SUM', db.sequelize.col('discount_amount')), 'total_discounts']
      ],
      raw: true
    });
    
    // Get payment method breakdown
    const paymentMethodBreakdown = await db.Sale.findAll({
      where: {
        sale_date: {
          [Op.between]: [startDate, endDate]
        },
        payment_status: {
          [Op.not]: 'cancelled'
        }
      },
      attributes: [
        'payment_method',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total']
      ],
      group: ['payment_method'],
      raw: true
    });
    
    // Get refund summary
    const refundSummary = await db.Refund.findAll({
      include: [{
        model: db.Sale,
        as: 'sale',
        attributes: [],
        where: {
          sale_date: {
            [Op.between]: [startDate, endDate]
          }
        },
        required: true
      }],
      attributes: [
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'total_refunds'],
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total_refunded_amount']
      ],
      raw: true
    });

    // Get daily sales for chart
    const dailySales = await db.Sale.findAll({
      where: {
        sale_date: {
          [Op.between]: [startDate, endDate]
        },
        payment_status: {
          [Op.not]: 'cancelled'
        }
      },
      attributes: [
        [db.sequelize.fn('date_trunc', 'day', db.sequelize.col('sale_date')), 'date'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('total_amount')), 'total']
      ],
      group: [db.sequelize.fn('date_trunc', 'day', db.sequelize.col('sale_date'))],
      order: [db.sequelize.literal('date ASC')],
      raw: true
    });

    // Format the response
    res.status(200).json({
      success: true,
      data: {
        period: {
          start_date: startDate,
          end_date: endDate
        },
        summary: {
          total_sales: parseInt(salesSummary[0].total_sales) || 0,
          total_revenue: parseFloat(salesSummary[0].total_revenue) || 0,
          average_sale_value: parseFloat(salesSummary[0].average_sale_value) || 0,
          total_tax: parseFloat(salesSummary[0].total_tax) || 0,
          total_discounts: parseFloat(salesSummary[0].total_discounts) || 0,
          total_refunds: parseInt(refundSummary[0]?.total_refunds) || 0,
          total_refunded_amount: parseFloat(refundSummary[0]?.total_refunded_amount) || 0,
          net_revenue: (parseFloat(salesSummary[0].total_revenue) || 0) - (parseFloat(refundSummary[0]?.total_refunded_amount) || 0)
        },
        payment_methods: paymentMethodBreakdown,
        daily_sales: dailySales
      }
    });
  } catch (error) {
    next(error);
  }
}; 