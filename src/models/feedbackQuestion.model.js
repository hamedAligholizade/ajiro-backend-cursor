const { DataTypes } = require('sequelize');

/**
 * FeedbackQuestion model for questions in feedback forms
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - FeedbackQuestion model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     FeedbackQuestion:
   *       type: object
   *       required:
   *         - form_id
   *         - question_text
   *         - question_type
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated question ID
   *         form_id:
   *           type: string
   *           format: uuid
   *           description: ID of the feedback form this question belongs to
   *         question_text:
   *           type: string
   *           description: Question text
   *         question_type:
   *           type: string
   *           enum: [rating, text, multiple_choice, checkbox]
   *           description: Type of question
   *         options:
   *           type: object
   *           description: Options for multiple choice or checkbox questions
   *         is_required:
   *           type: boolean
   *           description: Whether the question is required
   *         sequence:
   *           type: integer
   *           description: Display order of the question
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const FeedbackQuestion = sequelize.define('FeedbackQuestion', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    form_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'feedback_forms',
        key: 'id'
      }
    },
    question_text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    question_type: {
      type: DataTypes.ENUM('rating', 'text', 'multiple_choice', 'checkbox'),
      allowNull: false
    },
    options: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sequence: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'feedback_questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Define associations
  FeedbackQuestion.associate = (models) => {
    // FeedbackQuestion belongs to FeedbackForm
    if (models.FeedbackForm) {
      FeedbackQuestion.belongsTo(models.FeedbackForm, {
        foreignKey: 'form_id',
        as: 'form'
      });
    }

    // FeedbackQuestion has many FeedbackResponseDetails
    if (models.FeedbackResponseDetail) {
      FeedbackQuestion.hasMany(models.FeedbackResponseDetail, {
        foreignKey: 'question_id',
        as: 'responses'
      });
    }
  };

  return FeedbackQuestion;
}; 