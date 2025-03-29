const Joi = require('joi');

// Schema for validating UUID parameters
const idParam = Joi.object({
  id: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .messages({
      'string.guid': 'ID must be a valid UUID',
      'any.required': 'ID is required'
    })
});

// Schema for validating inventory update requests
const updateInventory = Joi.object({
  stock_quantity: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base': 'Stock quantity must be a number',
      'number.integer': 'Stock quantity must be an integer',
      'number.min': 'Stock quantity cannot be negative'
    }),
  
  available_quantity: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base': 'Available quantity must be a number',
      'number.integer': 'Available quantity must be an integer',
      'number.min': 'Available quantity cannot be negative'
    }),
  
  reserved_quantity: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base': 'Reserved quantity must be a number',
      'number.integer': 'Reserved quantity must be an integer',
      'number.min': 'Reserved quantity cannot be negative'
    }),
  
  reorder_level: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base': 'Reorder level must be a number',
      'number.integer': 'Reorder level must be an integer',
      'number.min': 'Reorder level cannot be negative'
    }),
  
  reorder_quantity: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Reorder quantity must be a number',
      'number.integer': 'Reorder quantity must be an integer',
      'number.min': 'Reorder quantity must be at least 1'
    }),
  
  location: Joi.string()
    .trim()
    .max(100)
    .messages({
      'string.max': 'Location cannot exceed 100 characters'
    }),
  
  adjustment_reason: Joi.string()
    .trim()
    .when('stock_quantity', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'any.required': 'Adjustment reason is required when changing stock quantity'
    })
});

// Schema for pagination query parameters
const paginationQuery = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  
  sortBy: Joi.string()
    .valid('created_at', 'updated_at', 'product_name', 'stock_quantity', 'available_quantity')
    .default('created_at')
    .messages({
      'any.only': 'Sort by field must be one of: created_at, updated_at, product_name, stock_quantity, available_quantity'
    }),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    })
});

module.exports = {
  idParam,
  updateInventory,
  paginationQuery
}; 