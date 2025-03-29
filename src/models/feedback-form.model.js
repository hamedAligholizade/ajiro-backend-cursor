const { DataTypes } = require('sequelize');

/**
 * FeedbackForm model for managing customer feedback forms
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize/types').DataTypes} DataTypes - Sequelize data types
 * @returns {import('sequelize').Model} - FeedbackForm model
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     FeedbackForm:
   *       type: object
   *       required:
   *         - title
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated feedback form ID
   *         title:
   *           type: string
   *           description: Title of the feedback form
   *         description:
   *           type: string
   *           description: Description of the feedback form
   *         is_active:
   *           type: boolean
   *           description: Whether the form is active and can be used
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
   *           description: User ID who created the form
   *         updated_by:
   *           type: string
   *           format: uuid
   *           description: User ID who last updated the form
   *         deleted_at:
   *           type: string
   *           format: date-time
   *           description: Soft delete timestamp
   *         deleted_by:
   *           type: string
   *           format: uuid
   *           description: User ID who deleted the form
   */
  const FeedbackForm = sequelize.define('FeedbackForm', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
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
    tableName: 'feedback_forms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false // We'll handle soft deletes manually
  });

  FeedbackForm.associate = (models) => {
    // FeedbackForm has many FeedbackQuestions
    FeedbackForm.hasMany(models.FeedbackQuestion, {
      foreignKey: 'form_id',
      as: 'questions'
    });

    // FeedbackForm has many FeedbackResponses
    FeedbackForm.hasMany(models.FeedbackResponse, {
      foreignKey: 'form_id',
      as: 'responses'
    });

    // FeedbackForm belongs to User (created_by)
    if (models.User) {
      FeedbackForm.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });

      FeedbackForm.belongsTo(models.User, {
        foreignKey: 'updated_by',
        as: 'updater'
      });

      FeedbackForm.belongsTo(models.User, {
        foreignKey: 'deleted_by',
        as: 'deleter'
      });
    }
  };

  return FeedbackForm;
}; 