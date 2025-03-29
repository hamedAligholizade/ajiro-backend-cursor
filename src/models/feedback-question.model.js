const { DataTypes } = require('sequelize');

/**
 * FeedbackQuestion model for storing questions in feedback forms
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize/types').DataTypes} DataTypes - Sequelize data types
 * @returns {import('sequelize').Model} - FeedbackQuestion model
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     FeedbackQuestion:
   *       type: object
   *       required:
   *         - form_id
   *         - text
   *         - type
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated question ID
   *         form_id:
   *           type: string
   *           format: uuid
   *           description: ID of the feedback form this question belongs to
   *         text:
   *           type: string
   *           description: Text of the question
   *         type:
   *           type: string
   *           enum: [text, rating, choice, multi-choice]
   *           description: Type of question (text, rating, choice, multi-choice)
   *         options:
   *           type: array
   *           items:
   *             type: string
   *           description: Available options for choice and multi-choice questions
   *         required:
   *           type: boolean
   *           description: Whether an answer is required for this question
   *         order:
   *           type: integer
   *           description: Order/sequence of the question in the form
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   *         created_by:
   *           type: string
   *           format: uuid
   *           description: User ID who created the question
   *         updated_by:
   *           type: string
   *           format: uuid
   *           description: User ID who last updated the question
   *         deleted_at:
   *           type: string
   *           format: date-time
   *           description: Soft delete timestamp
   *         deleted_by:
   *           type: string
   *           format: uuid
   *           description: User ID who deleted the question
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
      },
      onDelete: 'CASCADE'
    },
    text: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('text', 'rating', 'choice', 'multi-choice'),
      allowNull: false
    },
    options: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Options for choice and multi-choice questions'
    },
    required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deleted_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'feedback_questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false // We'll handle soft deletes manually
  });

  FeedbackQuestion.associate = (models) => {
    // FeedbackQuestion belongs to FeedbackForm
    FeedbackQuestion.belongsTo(models.FeedbackForm, {
      foreignKey: 'form_id',
      as: 'form'
    });

    // FeedbackQuestion has many FeedbackResponseDetails
    FeedbackQuestion.hasMany(models.FeedbackResponseDetail, {
      foreignKey: 'question_id',
      as: 'responses'
    });

    // FeedbackQuestion belongs to User (created_by)
    if (models.User) {
      FeedbackQuestion.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });

      FeedbackQuestion.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
      });

      FeedbackQuestion.belongsTo(models.User, {
        foreignKey: 'deleted_by',
        as: 'deleter'
      });
    }
  };

  return FeedbackQuestion;
}; 