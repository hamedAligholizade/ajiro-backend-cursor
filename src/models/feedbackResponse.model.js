const { DataTypes } = require('sequelize');

/**
 * FeedbackResponse model for customer feedback responses
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - FeedbackResponse model
 */
module.exports = (sequelize) => {
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
   *           description: The auto-generated feedback response ID
   *         form_id:
   *           type: string
   *           format: uuid
   *           description: ID of the feedback form this response belongs to
   *         customer_id:
   *           type: string
   *           format: uuid
   *           description: ID of the customer who submitted the feedback
   *         sale_id:
   *           type: string
   *           format: uuid
   *           description: ID of the sale this feedback is for
   *         response_date:
   *           type: string
   *           format: date-time
   *           description: When the response was submitted
   *         overall_rating:
   *           type: integer
   *           description: Overall rating for the feedback
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
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
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    sale_id: {
      type: DataTypes.UUID,
      references: {
        model: 'sales',
        key: 'id'
      }
    },
    response_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    overall_rating: {
      type: DataTypes.INTEGER,
      validate: {
        min: 1,
        max: 5
      }
    }
  }, {
    tableName: 'feedback_responses',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false // No updated_at for responses
  });

  // Define associations
  FeedbackResponse.associate = (models) => {
    // FeedbackResponse belongs to FeedbackForm
    if (models.FeedbackForm) {
      FeedbackResponse.belongsTo(models.FeedbackForm, {
        foreignKey: 'form_id',
        as: 'form'
      });
    }

    // FeedbackResponse belongs to Customer
    if (models.Customer) {
      FeedbackResponse.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
    }

    // FeedbackResponse belongs to Sale
    if (models.Sale) {
      FeedbackResponse.belongsTo(models.Sale, {
        foreignKey: 'sale_id',
        as: 'sale'
      });
    }

    // FeedbackResponse has many FeedbackResponseDetails
    if (models.FeedbackResponseDetail) {
      FeedbackResponse.hasMany(models.FeedbackResponseDetail, {
        foreignKey: 'response_id',
        as: 'details'
      });
    }
  };

  return FeedbackResponse;
}; 