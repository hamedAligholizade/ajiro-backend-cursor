const { DataTypes } = require('sequelize');

/**
 * LoyaltyTransaction model for tracking customer loyalty points
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - LoyaltyTransaction model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     LoyaltyTransaction:
   *       type: object
   *       required:
   *         - customer_id
   *         - points
   *         - type
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated transaction ID
   *         customer_id:
   *           type: string
   *           format: uuid
   *           description: ID of the customer this transaction belongs to
   *         sale_id:
   *           type: string
   *           format: uuid
   *           description: ID of the sale that generated this transaction (if applicable)
   *         user_id:
   *           type: string
   *           format: uuid
   *           description: ID of the user who performed this transaction
   *         points:
   *           type: integer
   *           description: Number of points earned or used
   *         type:
   *           type: string
   *           enum: [credit, debit]
   *           description: Type of transaction (credit = earned, debit = used)
   *         description:
   *           type: string
   *           description: Description of the transaction
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   */
  const LoyaltyTransaction = sequelize.define('LoyaltyTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: false,
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
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('credit', 'debit'),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'loyalty_transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at timestamp for transactions
    
    // Indexes
    indexes: [
      {
        name: 'idx_loyalty_transactions_customer_id',
        fields: ['customer_id']
      },
      {
        name: 'idx_loyalty_transactions_sale_id',
        fields: ['sale_id']
      }
    ]
  });

  // Define associations
  LoyaltyTransaction.associate = (models) => {
    // LoyaltyTransaction belongs to Customer
    LoyaltyTransaction.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer'
    });

    // LoyaltyTransaction belongs to Sale (optional)
    LoyaltyTransaction.belongsTo(models.Sale, {
      foreignKey: 'sale_id',
      as: 'sale'
    });

    // LoyaltyTransaction belongs to User (who performed the transaction)
    LoyaltyTransaction.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return LoyaltyTransaction;
}; 