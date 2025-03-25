const { DataTypes } = require('sequelize');

/**
 * Sale model for transaction management
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - Sale model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     Sale:
   *       type: object
   *       required:
   *         - user_id
   *         - subtotal
   *         - total_amount
   *         - payment_method
   *         - payment_status
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated sale ID
   *         invoice_number:
   *           type: string
   *           description: Unique invoice number
   *         customer_id:
   *           type: string
   *           format: uuid
   *           nullable: true
   *           description: ID of the customer associated with this sale
   *         user_id:
   *           type: string
   *           format: uuid
   *           description: ID of the user who created the sale
   *         sale_date:
   *           type: string
   *           format: date-time
   *           description: Date and time of the sale
   *         subtotal:
   *           type: number
   *           format: decimal
   *           description: Sale subtotal before tax and discounts
   *         discount_amount:
   *           type: number
   *           format: decimal
   *           description: Total discount amount
   *         tax_amount:
   *           type: number
   *           format: decimal
   *           description: Total tax amount
   *         total_amount:
   *           type: number
   *           format: decimal
   *           description: Total sale amount
   *         payment_method:
   *           type: string
   *           enum: [cash, card, mobile, credit, mixed]
   *           description: Method of payment
   *         payment_status:
   *           type: string
   *           enum: [paid, partial, unpaid, refunded]
   *           description: Payment status
   *         notes:
   *           type: string
   *           description: Additional notes about the sale
   *         loyalty_points_earned:
   *           type: integer
   *           description: Loyalty points earned from this sale
   *         loyalty_points_used:
   *           type: integer
   *           description: Loyalty points used for discount
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const Sale = sequelize.define('Sale', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      unique: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sale_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'card', 'mobile', 'credit', 'mixed'),
      allowNull: false
    },
    payment_status: {
      type: DataTypes.ENUM('paid', 'partial', 'unpaid', 'refunded'),
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT
    },
    loyalty_points_earned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    loyalty_points_used: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'sales',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // Hooks
    hooks: {
      beforeCreate: async (sale) => {
        // Generate a unique invoice number if not provided
        if (!sale.invoice_number) {
          const prefix = 'INV';
          const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
          const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          sale.invoice_number = `${prefix}-${date}-${random}`;
        }
      }
    }
  });

  // Define associations
  Sale.associate = (models) => {
    // Sale belongs to Customer
    Sale.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer'
    });

    // Sale belongs to User
    Sale.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Sale has many SaleItems
    Sale.hasMany(models.SaleItem, {
      foreignKey: 'sale_id',
      as: 'items'
    });

    // Sale has many Payments
    Sale.hasMany(models.Payment, {
      foreignKey: 'sale_id',
      as: 'payments'
    });

    // Sale has many Refunds
    Sale.hasMany(models.Refund, {
      foreignKey: 'sale_id',
      as: 'refunds'
    });

    // Sale has many LoyaltyTransactions
    Sale.hasMany(models.LoyaltyTransaction, {
      foreignKey: 'sale_id',
      as: 'loyalty_transactions'
    });
  };

  return Sale;
}; 