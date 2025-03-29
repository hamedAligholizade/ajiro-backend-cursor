const { Op } = require('sequelize');
const AppError = require('../utils/appError');
const { getPagination, getPaginationParams } = require('../utils/pagination');
const sequelize = require('../db/sequelize');
const { FeedbackForm, FeedbackQuestion, FeedbackResponse, FeedbackResponseDetail, Customer, Order } = require('../models');

/**
 * Controller for feedback management
 */
class FeedbackController {
  /**
   * Get all feedback forms with pagination and filtering options
   */
  async getAllForms(req, res, next) {
    try {
      const { page, limit } = req.query;
      const { limit: limitValue, offset } = getPaginationParams(req.query);
      
      const where = {};
      if (req.query.is_active !== undefined) {
        where.is_active = req.query.is_active === 'true';
      }
      where.deleted_at = null;

      const feedbackForms = await FeedbackForm.findAndCountAll({
        limit: limitValue,
        offset,
        order: [['created_at', 'DESC']],
        where,
        attributes: { exclude: ['deleted_at'] }
      });

      return res.status(200).json({
        success: true,
        message: 'Feedback forms retrieved successfully',
        data: feedbackForms.rows,
        pagination: getPagination({
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 10,
          total: feedbackForms.count,
          baseUrl: '/api/feedback/forms'
        })
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific feedback form by ID, including its questions
   */
  async getFormById(req, res, next) {
    try {
      const { id } = req.params;
      
      const feedbackForm = await FeedbackForm.findOne({
        where: { id, deleted_at: null },
        include: [
          {
            model: FeedbackQuestion,
            as: 'questions',
            where: { deleted_at: null },
            required: false,
            order: [['order', 'ASC']]
          }
        ]
      });

      if (!feedbackForm) {
        return next(new AppError('Feedback form not found', 404));
      }

      return res.status(200).json({
        success: true,
        message: 'Feedback form retrieved successfully',
        data: feedbackForm
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new feedback form
   */
  async createForm(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { title, description, is_active } = req.body;
      
      const newFeedbackForm = await FeedbackForm.create(
        { 
          title, 
          description, 
          is_active,
          created_by: req.user.id
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: 'Feedback form created successfully',
        data: newFeedbackForm
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Update an existing feedback form
   */
  async updateForm(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { title, description, is_active } = req.body;
      
      const feedbackForm = await FeedbackForm.findOne({
        where: { id, deleted_at: null }
      });

      if (!feedbackForm) {
        await transaction.rollback();
        return next(new AppError('Feedback form not found', 404));
      }

      await feedbackForm.update(
        { 
          title, 
          description, 
          is_active,
          updated_by: req.user.id
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: 'Feedback form updated successfully',
        data: feedbackForm
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Delete a feedback form (soft delete)
   */
  async deleteForm(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      
      const feedbackForm = await FeedbackForm.findOne({
        where: { id, deleted_at: null }
      });

      if (!feedbackForm) {
        await transaction.rollback();
        return next(new AppError('Feedback form not found', 404));
      }

      await feedbackForm.update(
        { 
          deleted_at: new Date(),
          deleted_by: req.user.id
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: 'Feedback form deleted successfully'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Add a question to a feedback form
   */
  async addQuestion(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params; // Form ID
      const { text, type, options, required, order } = req.body;
      
      // Check if form exists
      const feedbackForm = await FeedbackForm.findOne({
        where: { id, deleted_at: null }
      });

      if (!feedbackForm) {
        await transaction.rollback();
        return next(new AppError('Feedback form not found', 404));
      }

      // Create question
      const newQuestion = await FeedbackQuestion.create(
        {
          form_id: id,
          text,
          type,
          options: type === 'choice' || type === 'multi-choice' ? options : null,
          required,
          order,
          created_by: req.user.id
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(201).json({
        success: true,
        message: 'Feedback question created successfully',
        data: newQuestion
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Update an existing question
   */
  async updateQuestion(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id, questionId } = req.params;
      const { text, type, options, required, order } = req.body;
      
      // Verify question belongs to form
      const question = await FeedbackQuestion.findOne({
        where: { 
          id: questionId, 
          form_id: id,
          deleted_at: null 
        }
      });

      if (!question) {
        await transaction.rollback();
        return next(new AppError('Feedback question not found', 404));
      }

      await question.update(
        {
          text,
          type,
          options: (type === 'choice' || type === 'multi-choice') ? options : null,
          required,
          order,
          updated_by: req.user.id
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(200).json({
        success: true,
        message: 'Feedback question updated successfully',
        data: question
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Delete a question from a feedback form
   */
  async deleteQuestion(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { id, questionId } = req.params;
      
      // Verify question belongs to form
      const question = await FeedbackQuestion.findOne({
        where: { 
          id: questionId, 
          form_id: id,
          deleted_at: null 
        }
      });
      
      if (!question) {
        await transaction.rollback();
        return next(new AppError('Question not found', 404));
      }
      
      // Check if question has responses
      if (FeedbackResponseDetail) {
        const responseCount = await FeedbackResponseDetail.count({
          where: { question_id: questionId }
        });
        
        if (responseCount > 0) {
          await transaction.rollback();
          return next(new AppError('Cannot delete question with existing responses', 400));
        }
      }
      
      await question.update(
        { 
          deleted_at: new Date(),
          deleted_by: req.user.id
        },
        { transaction }
      );
      
      // Update order numbers for remaining questions
      const remainingQuestions = await FeedbackQuestion.findAll({
        where: {
          form_id: id,
          order: { [Op.gt]: question.order },
          deleted_at: null
        },
        order: [['order', 'ASC']],
        transaction
      });
      
      for (const q of remainingQuestions) {
        await q.update({ order: q.order - 1 }, { transaction });
      }
      
      await transaction.commit();
      
      return res.status(200).json({
        success: true,
        message: 'Question deleted successfully'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Submit a feedback response
   */
  async submitResponse(req, res, next) {
    const transaction = await sequelize.transaction();
    
    try {
      const { form_id, customer_id, responses } = req.body;
      
      // Verify the form exists and is active
      const form = await FeedbackForm.findOne({
        where: { id: form_id, deleted_at: null }
      });
      
      if (!form) {
        await transaction.rollback();
        return next(new AppError('Feedback form not found', 404));
      }
      
      if (!form.is_active) {
        await transaction.rollback();
        return next(new AppError('Feedback form is no longer active', 400));
      }
      
      // Verify the customer exists if Customer model is available
      if (customer_id && Customer) {
        const customer = await Customer.findByPk(customer_id);
        
        if (!customer) {
          await transaction.rollback();
          return next(new AppError('Customer not found', 404));
        }
      }
      
      // Get all required questions for this form
      const requiredQuestions = await FeedbackQuestion.findAll({
        where: { 
          form_id, 
          required: true,
          deleted_at: null
        },
        attributes: ['id']
      });
      
      const requiredQuestionIds = requiredQuestions.map(q => q.id);
      const submittedQuestionIds = responses.map(r => r.question_id);
      
      // Check if all required questions are answered
      const missingRequiredQuestions = requiredQuestionIds.filter(
        id => !submittedQuestionIds.includes(id)
      );
      
      if (missingRequiredQuestions.length > 0) {
        await transaction.rollback();
        return next(new AppError('Not all required questions are answered', 400));
      }
      
      // Create the feedback response
      const feedbackResponse = await FeedbackResponse.create({
        form_id,
        customer_id,
        response_date: new Date()
      }, { transaction });
      
      // Create response details for each question answer
      const responseDetails = [];
      
      for (const response of responses) {
        const { question_id, value } = response;
        
        // Validate the question belongs to the form
        const question = await FeedbackQuestion.findOne({
          where: { 
            id: question_id, 
            form_id,
            deleted_at: null
          }
        });
        
        if (!question) {
          await transaction.rollback();
          return next(new AppError(`Question ${question_id} does not belong to this form`, 400));
        }
        
        // Determine the appropriate field for the value based on question type
        let answer_text = null;
        let answer_rating = null;
        let answer_options = null;
        
        if (question.type === 'text') {
          answer_text = String(value);
        } else if (question.type === 'rating') {
          answer_rating = Number(value);
        } else if (['choice', 'multi-choice'].includes(question.type)) {
          answer_options = value;
        }
        
        // Create the response detail
        const detail = await FeedbackResponseDetail.create({
          response_id: feedbackResponse.id,
          question_id,
          answer_text,
          answer_rating,
          answer_options
        }, { transaction });
        
        responseDetails.push(detail);
      }
      
      await transaction.commit();
      
      return res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: {
          id: feedbackResponse.id,
          form_id,
          customer_id,
          response_date: feedbackResponse.response_date,
          details: responseDetails
        }
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }

  /**
   * Get feedback responses with pagination and filtering
   */
  async getResponses(req, res, next) {
    try {
      const { page, size, sortBy = 'created_at', sortOrder = 'DESC' } = getPaginationParams(req.query);
      const { limit, offset } = getPagination(page, size);
      
      const { form_id, customer_id, start_date, end_date } = req.query;
      
      const where = {};
      
      if (form_id) where.form_id = form_id;
      if (customer_id) where.customer_id = customer_id;
      
      if (start_date || end_date) {
        where.response_date = {};
        if (start_date) where.response_date[Op.gte] = new Date(start_date);
        if (end_date) where.response_date[Op.lte] = new Date(end_date);
      }
      
      const include = [];
      
      if (Customer) {
        include.push({
          model: Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        });
      }
      
      include.push({
        model: FeedbackForm,
        as: 'form',
        attributes: ['id', 'title']
      });
      
      const responses = await FeedbackResponse.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
        include
      });
      
      return res.status(200).json({
        success: true,
        message: 'Feedback responses retrieved successfully',
        data: responses.rows,
        pagination: {
          total: responses.count,
          page,
          size: limit
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific feedback response by ID with all details
   */
  async getResponseById(req, res, next) {
    try {
      const { id } = req.params;
      
      const include = [];
      
      if (Customer) {
        include.push({
          model: Customer,
          as: 'customer',
          attributes: ['id', 'first_name', 'last_name', 'email']
        });
      }
      
      include.push({
        model: FeedbackForm,
        as: 'form',
        attributes: ['id', 'title', 'description']
      });
      
      if (Order) {
        include.push({
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'order_date', 'total_amount']
        });
      }
      
      include.push({
        model: FeedbackResponseDetail,
        as: 'details',
        include: [{
          model: FeedbackQuestion,
          as: 'question',
          attributes: ['id', 'text', 'type', 'options']
        }]
      });
      
      const response = await FeedbackResponse.findByPk(id, { include });
      
      if (!response) {
        return next(new AppError('Feedback response not found', 404));
      }
      
      return res.status(200).json({
        success: true,
        message: 'Feedback response retrieved successfully',
        data: response
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get feedback analytics and statistics
   */
  async getAnalytics(req, res, next) {
    try {
      const { form_id, start_date, end_date } = req.query;
      
      if (!form_id) {
        return next(new AppError('Form ID is required for analytics', 400));
      }
      
      // Verify the form exists
      const form = await FeedbackForm.findOne({
        where: { id: form_id, deleted_at: null },
        include: [{
          model: FeedbackQuestion,
          as: 'questions',
          where: { deleted_at: null },
          required: false
        }]
      });
      
      if (!form) {
        return next(new AppError('Feedback form not found', 404));
      }
      
      // Date filter
      const dateFilter = {};
      if (start_date || end_date) {
        dateFilter.response_date = {};
        if (start_date) dateFilter.response_date[Op.gte] = new Date(start_date);
        if (end_date) dateFilter.response_date[Op.lte] = new Date(end_date);
      }
      
      // Total responses count
      const totalResponses = await FeedbackResponse.count({
        where: { 
          form_id,
          ...dateFilter
        }
      });
      
      // Process statistics for each question
      const questionStats = [];
      
      for (const question of form.questions) {
        let stats = {
          question_id: question.id,
          question_text: question.text,
          question_type: question.type,
          response_count: 0
        };
        
        const whereClause = {
          question_id: question.id
        };
        
        const details = await FeedbackResponseDetail.findAll({
          where: whereClause,
          include: [{
            model: FeedbackResponse,
            as: 'response',
            where: {
              form_id,
              ...dateFilter
            }
          }]
        });
        
        stats.response_count = details.length;
        
        // For rating questions, calculate average rating
        if (question.type === 'rating') {
          const ratings = details
            .map(d => d.answer_rating)
            .filter(r => r !== null && r !== undefined);
          
          const sum = ratings.reduce((a, b) => a + b, 0);
          stats.avg_rating = ratings.length > 0 ? (sum / ratings.length).toFixed(2) : null;
        }
        
        // For choice or multi-choice questions, calculate distribution
        if (['choice', 'multi-choice'].includes(question.type) && question.options) {
          const optionCounts = {};
          
          // Initialize all options with 0 count
          question.options.forEach(option => {
            optionCounts[option] = 0;
          });
          
          // Count each option
          details.forEach(detail => {
            if (!detail.answer_options) return;
            
            const selectedOptions = Array.isArray(detail.answer_options) 
              ? detail.answer_options 
              : [detail.answer_options];
            
            selectedOptions.forEach(option => {
              if (optionCounts.hasOwnProperty(option)) {
                optionCounts[option]++;
              }
            });
          });
          
          stats.option_distribution = optionCounts;
        }
        
        questionStats.push(stats);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Feedback analytics retrieved successfully',
        data: {
          form_id: form.id,
          form_title: form.title,
          total_responses: totalResponses,
          questions: questionStats
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeedbackController(); 