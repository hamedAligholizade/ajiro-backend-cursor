const { DataTypes } = require('sequelize');

/**
 * FeedbackResponse model for storing customer responses to feedback forms
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize/types').DataTypes} DataTypes - Sequelize data types
 * @returns {import('sequelize').Model} - FeedbackResponse model
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     FeedbackResponse:
   *       type: object
   *       required:
   *         - form_id
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated response ID
   *         form_id:
   *           type: string
   *           format: uuid
   *           description: ID of the feedback form being responded to
   *         customer_id:
   *           type: string
   *           format: uuid
   *           description: ID of the customer providing feedback (optional)
   *         order_id:
   *           type: string
   *           format: uuid
   *           description: ID of the related order (optional)
   *         response_date:
   *           type: string
   *           format: date-time
   *           description: Date and time when the feedback was submitted
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const FeedbackResponse = sequelize.define('FeedbackResponse', {
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
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    response_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'feedback_responses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  FeedbackResponse.associate = (models) => {
    // FeedbackResponse belongs to FeedbackForm
    FeedbackResponse.belongsTo(models.FeedbackForm, {
      foreignKey: 'form_id',
      as: 'form'
    });

    // FeedbackResponse has many FeedbackResponseDetails
    FeedbackResponse.hasMany(models.FeedbackResponseDetail, {
      foreignKey: 'response_id',
      as: 'details'
    });

    // FeedbackResponse belongs to Customer (if exists)
    if (models.Customer) {
      FeedbackResponse.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
    }

    // FeedbackResponse belongs to Order (if exists)
    if (models.Order) {
      FeedbackResponse.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });
    }
  };

  return FeedbackResponse;
}; 