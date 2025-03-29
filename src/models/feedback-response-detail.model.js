const { DataTypes } = require('sequelize');

/**
 * FeedbackResponseDetail model for storing individual question responses
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize/types').DataTypes} DataTypes - Sequelize data types
 * @returns {import('sequelize').Model} - FeedbackResponseDetail model
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     FeedbackResponseDetail:
   *       type: object
   *       required:
   *         - response_id
   *         - question_id
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated response detail ID
   *         response_id:
   *           type: string
   *           format: uuid
   *           description: ID of the parent feedback response
   *         question_id:
   *           type: string
   *           format: uuid
   *           description: ID of the question being answered
   *         answer_text:
   *           type: string
   *           description: Text answer for text questions
   *         answer_rating:
   *           type: integer
   *           description: Rating value for rating questions (typically 1-5)
   *         answer_options:
   *           type: array
   *           items:
   *             type: string
   *           description: Selected options for choice/multi-choice questions
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const FeedbackResponseDetail = sequelize.define('FeedbackResponseDetail', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    response_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'feedback_responses',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    question_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'feedback_questions',
        key: 'id'
      }
    },
    answer_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Text answer for open-ended questions'
    },
    answer_rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Rating value (1-5) for rating questions'
    },
    answer_options: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Selected option(s) for choice/multi-choice questions'
    }
  }, {
    tableName: 'feedback_response_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  FeedbackResponseDetail.associate = (models) => {
    // FeedbackResponseDetail belongs to FeedbackResponse
    FeedbackResponseDetail.belongsTo(models.FeedbackResponse, {
      foreignKey: 'response_id',
      as: 'response'
    });

    // FeedbackResponseDetail belongs to FeedbackQuestion
    FeedbackResponseDetail.belongsTo(models.FeedbackQuestion, {
      foreignKey: 'question_id',
      as: 'question'
    });
  };

  return FeedbackResponseDetail;
}; 