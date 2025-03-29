const { DataTypes } = require('sequelize');

/**
 * FeedbackForm model for customer feedback forms
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - FeedbackForm model
 */
module.exports = (sequelize) => {
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
   *           description: Form title
   *         description:
   *           type: string
   *           description: Form description
   *         is_active:
   *           type: boolean
   *           description: Whether the form is active
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const FeedbackForm = sequelize.define('FeedbackForm', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'feedback_forms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Define associations
  FeedbackForm.associate = (models) => {
    // FeedbackForm has many FeedbackQuestions
    if (models.FeedbackQuestion) {
      FeedbackForm.hasMany(models.FeedbackQuestion, {
        foreignKey: 'form_id',
        as: 'questions'
      });
    }

    // FeedbackForm has many FeedbackResponses
    if (models.FeedbackResponse) {
      FeedbackForm.hasMany(models.FeedbackResponse, {
        foreignKey: 'form_id',
        as: 'responses'
      });
    }
  };

  return FeedbackForm;
}; 