const { DataTypes } = require('sequelize');

/**
 * FeedbackResponseDetail model for individual question responses
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - FeedbackResponseDetail model
 */
module.exports = (sequelize) => {
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
   *           description: ID of the feedback response this detail belongs to
   *         question_id:
   *           type: string
   *           format: uuid
   *           description: ID of the question being answered
   *         answer_text:
   *           type: string
   *           description: Text answer for open-ended questions
   *         answer_rating:
   *           type: integer
   *           description: Rating answer for rating questions
   *         answer_options:
   *           type: object
   *           description: Selected options for multiple choice or checkbox questions
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
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
      }
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
      type: DataTypes.TEXT
    },
    answer_rating: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5
      }
    },
    answer_options: {
      type: DataTypes.JSONB
    }
  }, {
    tableName: 'feedback_response_details',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // No updated_at for response details
  });

  // Define associations
  FeedbackResponseDetail.associate = (models) => {
    // FeedbackResponseDetail belongs to FeedbackResponse
    if (models.FeedbackResponse) {
      FeedbackResponseDetail.belongsTo(models.FeedbackResponse, {
        foreignKey: 'response_id',
        as: 'response'
      });
    }

    // FeedbackResponseDetail belongs to FeedbackQuestion
    if (models.FeedbackQuestion) {
      FeedbackResponseDetail.belongsTo(models.FeedbackQuestion, {
        foreignKey: 'question_id',
        as: 'question'
      });
    }
  };

  return FeedbackResponseDetail;
}; 