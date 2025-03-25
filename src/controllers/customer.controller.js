const { AppError } = require('../middleware/errorHandler');
const db = require('../models');
const { Op } = require('sequelize');

/**
 * Get all customers with pagination and filtering
 * @route GET /api/customers
 */
exports.getAllCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Build query with filtering options
    const query = {
      attributes: [
        'id', 'first_name', 'last_name', 'email', 'phone', 
        'birth_date', 'address', 'city', 'postal_code', 
        'loyalty_points', 'loyalty_tier', 'is_active', 
        'created_at', 'updated_at'
      ],
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
          { email: { [Op.iLike]: `%${req.query.search}%` } },
          { phone: { [Op.iLike]: `%${req.query.search}%` } }
        ]
      };
    }

    // Add loyalty tier filter if provided
    if (req.query.loyalty_tier) {
      query.where = {
        ...query.where,
        loyalty_tier: req.query.loyalty_tier
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

    // Add city filter if provided
    if (req.query.city) {
      query.where = {
        ...query.where,
        city: { [Op.iLike]: `%${req.query.city}%` }
      };
    }

    const { count, rows: customers } = await db.Customer.findAndCountAll(query);

    res.status(200).json({
      success: true,
      data: {
        customers,
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
 * Get customer by ID
 * @route GET /api/customers/:id
 */
exports.getCustomerById = async (req, res, next) => {
  try {
    const customer = await db.Customer.findByPk(req.params.id, {
      include: [
        {
          model: db.Sale,
          as: 'sales',
          limit: 5,
          order: [['created_at', 'DESC']],
          attributes: ['id', 'invoice_number', 'sale_date', 'total_amount', 'payment_status']
        }
      ]
    });

    if (!customer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }

    res.status(200).json({
      success: true,
      data: {
        customer
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new customer
 * @route POST /api/customers
 */
exports.createCustomer = async (req, res, next) => {
  try {
    const { 
      first_name, last_name, email, phone, birth_date,
      address, city, postal_code, notes
    } = req.body;

    // Check if email already exists
    if (email) {
      const existingCustomer = await db.Customer.findOne({ where: { email } });
      if (existingCustomer) {
        return next(new AppError('Email already in use by another customer', 400, 'EMAIL_IN_USE'));
      }
    }

    // Check if phone already exists
    if (phone) {
      const existingCustomer = await db.Customer.findOne({ where: { phone } });
      if (existingCustomer) {
        return next(new AppError('Phone number already in use by another customer', 400, 'PHONE_IN_USE'));
      }
    }

    // Create new customer
    const customer = await db.Customer.create({
      first_name,
      last_name,
      email,
      phone,
      birth_date,
      address,
      city,
      postal_code,
      notes,
      is_active: true,
      loyalty_points: 0,
      loyalty_tier: 'bronze'
    });

    res.status(201).json({
      success: true,
      data: {
        customer
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update customer
 * @route PUT /api/customers/:id
 */
exports.updateCustomer = async (req, res, next) => {
  try {
    const { 
      first_name, last_name, email, phone, birth_date,
      address, city, postal_code, notes
    } = req.body;
    
    const customerId = req.params.id;

    // Check if customer exists
    const customer = await db.Customer.findByPk(customerId);
    if (!customer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }

    // Check if email is being changed and is already in use
    if (email && email !== customer.email) {
      const existingCustomer = await db.Customer.findOne({ where: { email } });
      if (existingCustomer) {
        return next(new AppError('Email already in use by another customer', 400, 'EMAIL_IN_USE'));
      }
    }

    // Check if phone is being changed and is already in use
    if (phone && phone !== customer.phone) {
      const existingCustomer = await db.Customer.findOne({ where: { phone } });
      if (existingCustomer) {
        return next(new AppError('Phone number already in use by another customer', 400, 'PHONE_IN_USE'));
      }
    }

    // Update customer
    await customer.update({
      first_name: first_name || customer.first_name,
      last_name: last_name || customer.last_name,
      email: email || customer.email,
      phone: phone || customer.phone,
      birth_date: birth_date !== undefined ? birth_date : customer.birth_date,
      address: address !== undefined ? address : customer.address,
      city: city !== undefined ? city : customer.city,
      postal_code: postal_code !== undefined ? postal_code : customer.postal_code,
      notes: notes !== undefined ? notes : customer.notes
    });

    res.status(200).json({
      success: true,
      data: {
        customer
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Activate customer
 * @route PATCH /api/customers/:id/activate
 */
exports.activateCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    // Check if customer exists
    const customer = await db.Customer.findByPk(customerId);
    if (!customer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }

    // Update customer status
    await customer.update({ is_active: true });

    res.status(200).json({
      success: true,
      message: 'Customer activated successfully',
      data: {
        customer: {
          id: customer.id,
          is_active: customer.is_active
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate customer
 * @route PATCH /api/customers/:id/deactivate
 */
exports.deactivateCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    // Check if customer exists
    const customer = await db.Customer.findByPk(customerId);
    if (!customer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }

    // Update customer status
    await customer.update({ is_active: false });

    res.status(200).json({
      success: true,
      message: 'Customer deactivated successfully',
      data: {
        customer: {
          id: customer.id,
          is_active: customer.is_active
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete customer (soft delete)
 * @route DELETE /api/customers/:id
 */
exports.deleteCustomer = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    // Check if customer exists
    const customer = await db.Customer.findByPk(customerId);
    if (!customer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }

    // Check if customer has associated sales
    const salesCount = await db.Sale.count({ where: { customer_id: customerId } });
    if (salesCount > 0) {
      // Instead of deleting, just deactivate
      await customer.update({ is_active: false });
      
      return res.status(200).json({
        success: true,
        message: 'Customer has associated sales and cannot be deleted. Customer has been deactivated instead.',
        data: {
          customer: {
            id: customer.id,
            is_active: customer.is_active
          }
        }
      });
    }

    // Soft delete customer
    await customer.destroy();

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update customer loyalty points
 * @route PATCH /api/customers/:id/loyalty
 */
exports.updateLoyaltyPoints = async (req, res, next) => {
  try {
    const { points, description } = req.body;
    const customerId = req.params.id;

    if (!points || isNaN(points)) {
      return next(new AppError('Valid points value is required', 400, 'INVALID_POINTS'));
    }

    // Check if customer exists
    const customer = await db.Customer.findByPk(customerId);
    if (!customer) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }

    // Calculate new total points
    const newTotalPoints = customer.loyalty_points + parseInt(points, 10);
    if (newTotalPoints < 0) {
      return next(new AppError('Insufficient loyalty points', 400, 'INSUFFICIENT_POINTS'));
    }

    // Determine loyalty tier based on points
    let loyaltyTier = customer.loyalty_tier;
    if (newTotalPoints >= 1000) {
      loyaltyTier = 'platinum';
    } else if (newTotalPoints >= 500) {
      loyaltyTier = 'gold';
    } else if (newTotalPoints >= 200) {
      loyaltyTier = 'silver';
    } else {
      loyaltyTier = 'bronze';
    }

    // Update customer loyalty points and tier
    await customer.update({
      loyalty_points: newTotalPoints,
      loyalty_tier: loyaltyTier
    });

    // Record the loyalty transaction
    await db.LoyaltyTransaction.create({
      customer_id: customerId,
      points: points,
      type: points >= 0 ? 'credit' : 'debit',
      description: description || 'Manual adjustment',
      user_id: req.user.id
    });

    res.status(200).json({
      success: true,
      message: 'Loyalty points updated successfully',
      data: {
        customer: {
          id: customer.id,
          loyalty_points: customer.loyalty_points,
          loyalty_tier: customer.loyalty_tier
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get customer purchase history
 * @route GET /api/customers/:id/purchases
 */
exports.getCustomerPurchases = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    // Check if customer exists
    const customerExists = await db.Customer.findByPk(customerId);
    if (!customerExists) {
      return next(new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND'));
    }

    // Get customer purchases with pagination
    const { count, rows: sales } = await db.Sale.findAndCountAll({
      where: { customer_id: customerId },
      include: [
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
        }
      ],
      order: [['sale_date', 'DESC']],
      limit,
      offset
    });

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