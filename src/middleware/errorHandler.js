const logger = require('../utils/logger');
const config = require('../config');

// Custom error class for API errors
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Mark as operational error for better handling
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  // Log error
  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, { 
    stack: err.stack,
    errorCode: err.errorCode || 'INTERNAL_SERVER_ERROR'
  });
  
  // Handle specific error types
  
  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const message = err.errors.map(e => e.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }
  
  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Data already exists';
    error = new AppError(message, 409, 'DUPLICATE_ENTRY');
  }
  
  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Referenced data does not exist';
    error = new AppError(message, 400, 'FOREIGN_KEY_ERROR');
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401, 'INVALID_TOKEN');
  }
  
  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401, 'TOKEN_EXPIRED');
  }
  
  // Send standardized response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.errorCode || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'Internal server error',
      ...(config.server.env === 'development' && { stack: err.stack })
    }
  });
};

module.exports = {
  AppError,
  errorHandler
}; 