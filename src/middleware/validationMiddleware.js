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
  
  userRegister: Joi.object({
    email: Joi.string().email().max(255).required(),
    password: Joi.string().min(8).required(),
    first_name: Joi.string().max(100).required(),
    last_name: Joi.string().max(100).required(),
    phone: Joi.string().max(20),
    shop_name: Joi.string().max(100).required(),
    role: Joi.string().valid('cashier', 'inventory', 'marketing', 'manager').optional()
  }),
  
  // Category schemas
  categoryCreate: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().allow('', null),
    parent_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
    image_url: Joi.string().uri().allow('', null),
    is_active: Joi.boolean().default(true)
  }),
  
  categoryUpdate: Joi.object({
    name: Joi.string().max(100),
    description: Joi.string().allow('', null),
    parent_id: Joi.string().guid({ version: 'uuidv4' }).allow(null),
    image_url: Joi.string().uri().allow('', null),
    is_active: Joi.boolean()
  }),
  
  // Product schemas
  productCreate: Joi.object({
    name: Joi.string().max(255).required(),
    sku: Joi.string().max(50),
    barcode: Joi.string().max(50),
    description: Joi.string().allow('', null),
    category_id: Joi.string().guid({ version: 'uuidv4' }).required(),
    purchase_price: Joi.number().precision(2).min(0),
    selling_price: Joi.number().precision(2).min(0).required(),
    discount_price: Joi.number().precision(2).min(0),
    is_taxable: Joi.boolean().default(true),
    tax_rate: Joi.number().precision(2).min(0),
    image_url: Joi.string().uri().allow('', null),
    is_active: Joi.boolean().default(true),
    weight: Joi.number().precision(2).min(0),
    weight_unit: Joi.string().max(10),
    stock_quantity: Joi.number().integer().min(0).default(0),
    reorder_level: Joi.number().integer().min(0),
    reorder_quantity: Joi.number().integer().min(0),
    location: Joi.string().max(100)
  }),
  
  productUpdate: Joi.object({
    name: Joi.string().max(255),
    sku: Joi.string().max(50),
    barcode: Joi.string().max(50),
    description: Joi.string().allow('', null),
    category_id: Joi.string().guid({ version: 'uuidv4' }),
    purchase_price: Joi.number().precision(2).min(0),
    selling_price: Joi.number().precision(2).min(0),
    discount_price: Joi.number().precision(2).min(0),
    is_taxable: Joi.boolean(),
    tax_rate: Joi.number().precision(2).min(0),
    image_url: Joi.string().uri().allow('', null),
    is_active: Joi.boolean(),
    weight: Joi.number().precision(2).min(0),
    weight_unit: Joi.string().max(10)
  }),
  
  inventoryUpdate: Joi.object({
    stock_quantity: Joi.number().integer().min(0),
    available_quantity: Joi.number().integer().min(0),
    reserved_quantity: Joi.number().integer().min(0),
    reorder_level: Joi.number().integer().min(0),
    reorder_quantity: Joi.number().integer().min(0),
    location: Joi.string().max(100),
    adjustment_reason: Joi.string()
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
    customer_id: Joi.string().guid({ version: 'uuidv4' }),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.string().guid({ version: 'uuidv4' }).required(),
        quantity: Joi.number().integer().min(1).required(),
        discount_percent: Joi.number().min(0).max(100)
      })
    ).min(1).required(),
    payment_method: Joi.string().valid('cash', 'card', 'mobile', 'credit', 'mixed').required(),
    discount_amount: Joi.number().precision(2).min(0),
    loyalty_points_used: Joi.number().integer().min(0),
    notes: Joi.string()
  }),
  
  paymentStatusUpdate: Joi.object({
    payment_status: Joi.string().valid('paid', 'partial', 'unpaid', 'refunded', 'cancelled').required()
  }),
  
  paymentCreate: Joi.object({
    amount: Joi.number().precision(2).min(0.01).required(),
    payment_method: Joi.string().valid('cash', 'card', 'mobile', 'credit', 'mixed').required(),
    reference_number: Joi.string().max(50)
  }),
  
  refundCreate: Joi.object({
    amount: Joi.number().precision(2).min(0.01).required(),
    reason: Joi.string().required(),
    refund_method: Joi.string().valid('cash', 'card', 'mobile', 'credit', 'mixed')
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
  }),

  // Add order validation schemas
  orderCreate: Joi.object({
    customer_id: Joi.string().uuid().required()
      .messages({
        'string.empty': 'Customer ID is required',
        'string.uuid': 'Customer ID must be a valid UUID',
        'any.required': 'Customer ID is required'
      }),
    shipping_address: Joi.string().allow('', null),
    shipping_method: Joi.string().allow('', null),
    notes: Joi.string().allow('', null),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.string().uuid().required()
          .messages({
            'string.empty': 'Product ID is required',
            'string.uuid': 'Product ID must be a valid UUID',
            'any.required': 'Product ID is required'
          }),
        quantity: Joi.number().integer().min(1).required()
          .messages({
            'number.base': 'Quantity must be a number',
            'number.integer': 'Quantity must be an integer',
            'number.min': 'Quantity must be at least 1',
            'any.required': 'Quantity is required'
          })
      })
    ).min(1).required()
      .messages({
        'array.min': 'At least one item is required',
        'any.required': 'Items are required'
      })
  }),

  orderUpdate: Joi.object({
    shipping_address: Joi.string().allow('', null),
    shipping_method: Joi.string().allow('', null),
    notes: Joi.string().allow('', null)
  }).min(1)
    .messages({
      'object.min': 'At least one field to update is required'
    }),

  orderStatusUpdate: Joi.object({
    status: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').required()
      .messages({
        'string.empty': 'Status is required',
        'string.valid': 'Status must be one of: pending, processing, shipped, delivered, cancelled',
        'any.required': 'Status is required'
      }),
    note: Joi.string().allow('', null)
  }),

  orderItemCreate: Joi.object({
    product_id: Joi.string().uuid().required()
      .messages({
        'string.empty': 'Product ID is required',
        'string.uuid': 'Product ID must be a valid UUID',
        'any.required': 'Product ID is required'
      }),
    quantity: Joi.number().integer().min(1).required()
      .messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity is required'
      })
  }),

  orderItemUpdate: Joi.object({
    quantity: Joi.number().integer().min(1).required()
      .messages({
        'number.base': 'Quantity must be a number',
        'number.integer': 'Quantity must be an integer',
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity is required'
      })
  })
};

// Feedback validation schemas
const feedbackFormCreate = Joi.object({
  title: Joi.string().max(100).required()
    .messages({
      'string.empty': 'Form title is required',
      'string.max': 'Form title cannot exceed 100 characters',
      'any.required': 'Form title is required'
    }),
  description: Joi.string().allow('', null),
  is_active: Joi.boolean().default(true)
});

const feedbackFormUpdate = Joi.object({
  title: Joi.string().max(100)
    .messages({
      'string.max': 'Form title cannot exceed 100 characters'
    }),
  description: Joi.string().allow('', null),
  is_active: Joi.boolean()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const feedbackQuestionCreate = Joi.object({
  form_id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Form ID must be a valid UUID',
      'any.required': 'Form ID is required'
    }),
  question_text: Joi.string().required()
    .messages({
      'string.empty': 'Question text is required',
      'any.required': 'Question text is required'
    }),
  question_type: Joi.string().valid('rating', 'text', 'multiple_choice', 'checkbox').required()
    .messages({
      'string.empty': 'Question type is required',
      'any.only': 'Question type must be one of: rating, text, multiple_choice, checkbox',
      'any.required': 'Question type is required'
    }),
  options: Joi.when('question_type', {
    is: Joi.string().valid('multiple_choice', 'checkbox'),
    then: Joi.array().items(Joi.string()).min(1).required()
      .messages({
        'array.min': 'At least one option is required for multiple choice or checkbox questions',
        'any.required': 'Options are required for multiple choice or checkbox questions'
      }),
    otherwise: Joi.alternatives().try(Joi.array().length(0), Joi.valid(null))
  }),
  is_required: Joi.boolean().default(true),
  sequence: Joi.number().integer().min(1).required()
    .messages({
      'number.base': 'Sequence must be a number',
      'number.integer': 'Sequence must be an integer',
      'number.min': 'Sequence must be a positive number',
      'any.required': 'Sequence is required'
    })
});

const feedbackQuestionUpdate = Joi.object({
  question_text: Joi.string(),
  question_type: Joi.string().valid('rating', 'text', 'multiple_choice', 'checkbox')
    .messages({
      'any.only': 'Question type must be one of: rating, text, multiple_choice, checkbox'
    }),
  options: Joi.when('question_type', {
    is: Joi.string().valid('multiple_choice', 'checkbox'),
    then: Joi.array().items(Joi.string()).min(1)
      .messages({
        'array.min': 'At least one option is required for multiple choice or checkbox questions'
      }),
    otherwise: Joi.alternatives().try(Joi.array().length(0), Joi.valid(null))
  }),
  is_required: Joi.boolean(),
  sequence: Joi.number().integer().min(1)
    .messages({
      'number.base': 'Sequence must be a number',
      'number.integer': 'Sequence must be an integer',
      'number.min': 'Sequence must be a positive number'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

const feedbackResponseCreate = Joi.object({
  form_id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Form ID must be a valid UUID',
      'any.required': 'Form ID is required'
    }),
  customer_id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Customer ID must be a valid UUID',
      'any.required': 'Customer ID is required'
    }),
  sale_id: Joi.string().uuid().allow(null)
    .messages({
      'string.guid': 'Sale ID must be a valid UUID'
    }),
  overall_rating: Joi.number().integer().min(1).max(5).allow(null)
    .messages({
      'number.base': 'Overall rating must be a number',
      'number.integer': 'Overall rating must be an integer',
      'number.min': 'Overall rating must be between 1 and 5',
      'number.max': 'Overall rating must be between 1 and 5'
    }),
  responses: Joi.array().items(
    Joi.object({
      question_id: Joi.string().uuid().required()
        .messages({
          'string.guid': 'Question ID must be a valid UUID',
          'any.required': 'Question ID is required'
        }),
      answer_text: Joi.string().allow('', null),
      answer_rating: Joi.number().integer().min(1).max(5).allow(null)
        .messages({
          'number.base': 'Rating must be a number',
          'number.integer': 'Rating must be an integer',
          'number.min': 'Rating must be between 1 and 5',
          'number.max': 'Rating must be between 1 and 5'
        }),
      answer_options: Joi.alternatives().try(
        Joi.array().items(Joi.string()),
        Joi.string(),
        Joi.valid(null)
      )
    })
  ).min(1).required()
    .messages({
      'array.min': 'At least one question response is required',
      'any.required': 'Question responses are required'
    })
});

module.exports = {
  validate,
  schemas,
  // Feedback validation schemas
  feedbackFormCreate,
  feedbackFormUpdate,
  feedbackQuestionCreate,
  feedbackQuestionUpdate,
  feedbackResponseCreate
}; 