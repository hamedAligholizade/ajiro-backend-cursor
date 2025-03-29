const { DataTypes } = require('sequelize');

/**
 * Customer model for customer management
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - Customer model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     Customer:
   *       type: object
   *       required:
   *         - first_name
   *         - last_name
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated customer ID
   *         first_name:
   *           type: string
   *           description: Customer's first name
   *         last_name:
   *           type: string
   *           description: Customer's last name
   *         email:
   *           type: string
   *           format: email
   *           description: Customer's email address (unique)
   *         phone:
   *           type: string
   *           description: Customer's phone number (unique)
   *         birth_date:
   *           type: string
   *           format: date
   *           description: Customer's birth date
   *         address:
   *           type: string
   *           description: Customer's address
   *         city:
   *           type: string
   *           description: Customer's city
   *         postal_code:
   *           type: string
   *           description: Customer's postal/zip code
   *         notes:
   *           type: string
   *           description: Additional notes about the customer
   *         loyalty_points:
   *           type: integer
   *           description: Customer's loyalty points
   *         loyalty_tier:
   *           type: string
   *           enum: [bronze, silver, gold, platinum]
   *           description: Customer's loyalty tier
   *         is_active:
   *           type: boolean
   *           description: Whether the customer is active
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      unique: true
    },
    birth_date: {
      type: DataTypes.DATEONLY
    },
    address: {
      type: DataTypes.TEXT
    },
    city: {
      type: DataTypes.STRING(100)
    },
    postal_code: {
      type: DataTypes.STRING(20)
    },
    notes: {
      type: DataTypes.TEXT
    },
    loyalty_points: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    loyalty_tier: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
      defaultValue: 'bronze'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'customers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Define associations
  Customer.associate = (models) => {
    // Customer has many Sales
    if (models.Sale) {
      Customer.hasMany(models.Sale, {
        foreignKey: 'customer_id',
        as: 'sales'
      });
    }

    // Customer has many LoyaltyTransactions
    if (models.LoyaltyTransaction) {
      Customer.hasMany(models.LoyaltyTransaction, {
        foreignKey: 'customer_id',
        as: 'loyalty_transactions'
      });
    }

    // Customer has many LoyaltyRewardRedemptions
    if (models.LoyaltyRewardRedemption) {
      Customer.hasMany(models.LoyaltyRewardRedemption, {
        foreignKey: 'customer_id',
        as: 'reward_redemptions'
      });
    }

    // We'll implement these models later
    // These associations are commented out until the models are created
    /*
    // Customer has many CustomerGroupMembers
    if (models.CustomerGroupMember) {
      Customer.hasMany(models.CustomerGroupMember, {
        foreignKey: 'customer_id',
        as: 'group_memberships'
      });
    }

    // Customer has many FeedbackResponses
    if (models.FeedbackResponse) {
      Customer.hasMany(models.FeedbackResponse, {
        foreignKey: 'customer_id',
        as: 'feedback'
      });
    }
    */
  };

  // Virtual field for full name
  Customer.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
  };

  return Customer;
}; 