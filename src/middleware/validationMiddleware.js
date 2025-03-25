const Joi = require('joi');
const { AppError } = require('./errorHandler');

/**
 * Middleware generator for request validation using Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      errors: {
        wrap: {
          label: false
        }
      }
    });
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return next(new AppError(errorMessage, 400, 'VALIDATION_ERROR'));
    }
    
    // Replace request data with validated data
    req[source] = value;
    return next();
  };
};

// Common validation schemas
const schemas = {
  // User schemas
  userCreate: Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required(),
    role: Joi.string().valid('admin', 'manager', 'staff').default('staff')
  }),
  
  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  // Product schemas
  productCreate: Joi.object({
    name: Joi.string().required(),
    barcode: Joi.string(),
    description: Joi.string(),
    category: Joi.string().required(),
    price: Joi.number().positive().required(),
    cost: Joi.number().positive(),
    tax_rate: Joi.number().min(0),
    stock_quantity: Joi.number().integer().min(0).default(0),
    unit: Joi.string(),
    status: Joi.string().valid('active', 'inactive').default('active'),
    imageUrl: Joi.string().uri(),
    tags: Joi.array().items(Joi.string())
  }),
  
  // Customer schemas
  customerCreate: Joi.object({
    first_name: Joi.string().max(100).required(),
    last_name: Joi.string().max(100).required(),
    email: Joi.string().email().max(255),
    phone: Joi.string().max(20),
    birth_date: Joi.date(),
    address: Joi.string(),
    city: Joi.string().max(100),
    postal_code: Joi.string().max(20),
    notes: Joi.string()
  }),
  
  customerUpdate: Joi.object({
    first_name: Joi.string().max(100),
    last_name: Joi.string().max(100),
    email: Joi.string().email().max(255),
    phone: Joi.string().max(20),
    birth_date: Joi.date(),
    address: Joi.string(),
    city: Joi.string().max(100),
    postal_code: Joi.string().max(20),
    notes: Joi.string()
  }),
  
  loyaltyPointsUpdate: Joi.object({
    points: Joi.number().integer().required(),
    description: Joi.string()
  }),

  // Loyalty reward schemas
  loyaltyRewardCreate: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string(),
    points_required: Joi.number().integer().min(1).required(),
    reward_type: Joi.string().valid('discount', 'free_product', 'gift', 'service').required(),
    discount_amount: Joi.number().precision(2).min(0),
    discount_percent: Joi.number().precision(2).min(0).max(100),
    product_id: Joi.string().guid({ version: 'uuidv4' }),
    min_tier: Joi.string().valid('bronze', 'silver', 'gold', 'platinum').default('bronze'),
    image_url: Joi.string().uri(),
    start_date: Joi.date(),
    end_date: Joi.date().min(Joi.ref('start_date')),
    is_active: Joi.boolean().default(true)
  }),

  loyaltyRewardUpdate: Joi.object({
    name: Joi.string().max(100),
    description: Joi.string().allow('', null),
    points_required: Joi.number().integer().min(1),
    reward_type: Joi.string().valid('discount', 'free_product', 'gift', 'service'),
    discount_amount: Joi.number().precision(2).min(0),
    discount_percent: Joi.number().precision(2).min(0).max(100),
    product_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
    min_tier: Joi.string().valid('bronze', 'silver', 'gold', 'platinum'),
    image_url: Joi.string().uri().allow('', null),
    start_date: Joi.date().allow(null),
    end_date: Joi.date().min(Joi.ref('start_date')).allow(null),
    is_active: Joi.boolean()
  }),

  loyaltyRedemptionCreate: Joi.object({
    customer_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    reward_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    notes: Joi.string()
  }),

  redemptionStatusUpdate: Joi.object({
    status: Joi.string().valid('pending', 'completed', 'cancelled').required()
  }),
  
  // Sale schemas
  saleCreate: Joi.object({
    customer_id: Joi.number().integer(),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().required(),
        quantity: Joi.number().positive().required(),
        price: Joi.number().positive().required(),
        discount: Joi.number().min(0)
      })
    ).min(1).required(),
    payment_method: Joi.string().valid('cash', 'card', 'mobile').required(),
    discount: Joi.number().min(0),
    tax: Joi.number().min(0),
    notes: Joi.string()
  }),
  
  // ID parameter
  idParam: Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required()
  }),
  
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string(),
    order: Joi.string().valid('asc', 'desc').default('asc')
  })
};

module.exports = {
  validate,
  schemas
}; 