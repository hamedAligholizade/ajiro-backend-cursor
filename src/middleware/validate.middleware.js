const AppError = require('../utils/appError');

/**
 * Factory function for validating request data with Joi schemas
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, params, query)
 * @returns {Function} - Express middleware function
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }
    
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true
    });
    
    if (!error) {
      return next();
    }
    
    const messages = error.details.map(detail => detail.message).join(', ');
    return next(new AppError(`Validation error: ${messages}`, 400));
  };
};

module.exports = validate; 