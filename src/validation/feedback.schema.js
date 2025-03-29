const Joi = require('joi');

// Schema for validating feedback form creation
const feedbackFormCreate = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.base': 'Title must be a string',
      'string.empty': 'Title is required',
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  
  description: Joi.string()
    .trim()
    .max(500)
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  is_active: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'Active status must be a boolean'
    })
});

// Schema for validating feedback form updates
const feedbackFormUpdate = Joi.object({
  title: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .messages({
      'string.base': 'Title must be a string',
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 100 characters'
    }),
  
  description: Joi.string()
    .trim()
    .max(500)
    .allow('')
    .allow(null)
    .messages({
      'string.base': 'Description must be a string',
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  is_active: Joi.boolean()
    .messages({
      'boolean.base': 'Active status must be a boolean'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Schema for validating feedback question creation
const feedbackQuestionCreate = Joi.object({
  text: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.base': 'Question text must be a string',
      'string.empty': 'Question text is required',
      'string.min': 'Question text must be at least 3 characters',
      'string.max': 'Question text cannot exceed 255 characters',
      'any.required': 'Question text is required'
    }),
  
  type: Joi.string()
    .valid('text', 'rating', 'choice', 'multi-choice')
    .required()
    .messages({
      'string.base': 'Question type must be a string',
      'string.empty': 'Question type is required',
      'any.only': 'Question type must be one of: text, rating, choice, multi-choice',
      'any.required': 'Question type is required'
    }),
  
  options: Joi.when('type', {
    is: Joi.string().valid('choice', 'multi-choice'),
    then: Joi.array()
      .items(Joi.string().trim().min(1).max(100))
      .min(2)
      .required()
      .messages({
        'array.base': 'Options must be an array',
        'array.min': 'At least 2 options are required',
        'string.min': 'Each option must not be empty',
        'string.max': 'Each option cannot exceed 100 characters',
        'any.required': 'Options are required for choice and multi-choice questions'
      }),
    otherwise: Joi.optional()
  }),
  
  required: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Required flag must be a boolean'
    }),
  
  order: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base': 'Order must be a number',
      'number.integer': 'Order must be an integer',
      'number.min': 'Order cannot be negative'
    })
});

// Schema for validating feedback question updates
const feedbackQuestionUpdate = Joi.object({
  text: Joi.string()
    .trim()
    .min(3)
    .max(255)
    .messages({
      'string.base': 'Question text must be a string',
      'string.min': 'Question text must be at least 3 characters',
      'string.max': 'Question text cannot exceed 255 characters'
    }),
  
  type: Joi.string()
    .valid('text', 'rating', 'choice', 'multi-choice')
    .messages({
      'string.base': 'Question type must be a string',
      'any.only': 'Question type must be one of: text, rating, choice, multi-choice'
    }),
  
  options: Joi.when('type', {
    is: Joi.string().valid('choice', 'multi-choice'),
    then: Joi.array()
      .items(Joi.string().trim().min(1).max(100))
      .min(2)
      .messages({
        'array.base': 'Options must be an array',
        'array.min': 'At least 2 options are required',
        'string.min': 'Each option must not be empty',
        'string.max': 'Each option cannot exceed 100 characters'
      }),
    otherwise: Joi.optional()
  }),
  
  required: Joi.boolean()
    .messages({
      'boolean.base': 'Required flag must be a boolean'
    }),
  
  order: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.base': 'Order must be a number',
      'number.integer': 'Order must be an integer',
      'number.min': 'Order cannot be negative'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Schema for validating feedback response creation
const feedbackResponseCreate = Joi.object({
  form_id: Joi.string()
    .guid({ version: ['uuidv4'] })
    .required()
    .messages({
      'string.guid': 'Form ID must be a valid UUID',
      'any.required': 'Form ID is required'
    }),
  
  customer_id: Joi.string()
    .guid({ version: ['uuidv4'] })
    .messages({
      'string.guid': 'Customer ID must be a valid UUID'
    }),
  
  responses: Joi.array()
    .items(
      Joi.object({
        question_id: Joi.string()
          .guid({ version: ['uuidv4'] })
          .required()
          .messages({
            'string.guid': 'Question ID must be a valid UUID',
            'any.required': 'Question ID is required'
          }),
        
        value: Joi.alternatives()
          .try(
            Joi.string().trim().allow('').max(1000),
            Joi.number().min(1).max(5),
            Joi.array().items(Joi.string().trim().max(100))
          )
          .required()
          .messages({
            'any.required': 'Response value is required'
          })
      })
    )
    .min(1)
    .required()
    .messages({
      'array.base': 'Responses must be an array',
      'array.min': 'At least one response is required',
      'any.required': 'Responses are required'
    })
});

module.exports = {
  feedbackFormCreate,
  feedbackFormUpdate,
  feedbackQuestionCreate,
  feedbackQuestionUpdate,
  feedbackResponseCreate
}; 