const { DataTypes } = require('sequelize');

/**
 * LoyaltyRewardRedemption model for tracking reward redemptions
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - LoyaltyRewardRedemption model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     LoyaltyRewardRedemption:
   *       type: object
   *       required:
   *         - customer_id
   *         - reward_id
   *         - points_used
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated redemption ID
   *         customer_id:
   *           type: string
   *           format: uuid
   *           description: ID of the customer who redeemed the reward
   *         reward_id:
   *           type: string
   *           format: uuid
   *           description: ID of the reward that was redeemed
   *         points_used:
   *           type: integer
   *           description: Number of points used for redemption
   *         user_id:
   *           type: string
   *           format: uuid
   *           description: ID of the user who processed the redemption
   *         status:
   *           type: string
   *           enum: [pending, completed, cancelled]
   *           description: Status of the redemption
   *         notes:
   *           type: string
   *           description: Additional notes about the redemption
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Redemption timestamp
   */
  const LoyaltyRewardRedemption = sequelize.define('LoyaltyRewardRedemption', {
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
    reward_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'loyalty_rewards',
        key: 'id'
      }
    },
    points_used: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'loyalty_reward_redemptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at timestamp for redemptions
    
    // Hooks
    hooks: {
      afterCreate: async (redemption, options) => {
        try {
          const { Customer, LoyaltyTransaction } = require('./index');
          
          // Deduct loyalty points from customer when redemption is created
          if (redemption.status !== 'cancelled') {
            const customer = await Customer.findByPk(redemption.customer_id);
            
            if (customer) {
              // Update customer's loyalty points
              await customer.decrement('loyalty_points', { 
                by: redemption.points_used,
                transaction: options.transaction 
              });
              
              // Record loyalty transaction
              await LoyaltyTransaction.create({
                customer_id: redemption.customer_id,
                points: -redemption.points_used,
                type: 'debit',
                user_id: redemption.user_id,
                description: `Reward redemption: ${redemption.id}`
              }, { transaction: options.transaction });
            }
          }
        } catch (error) {
          console.error('Error processing redemption:', error);
        }
      }
    }
  });

  // Define associations
  LoyaltyRewardRedemption.associate = (models) => {
    // LoyaltyRewardRedemption belongs to Customer
    LoyaltyRewardRedemption.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer'
    });

    // LoyaltyRewardRedemption belongs to LoyaltyReward
    LoyaltyRewardRedemption.belongsTo(models.LoyaltyReward, {
      foreignKey: 'reward_id',
      as: 'reward'
    });

    // LoyaltyRewardRedemption belongs to User (who processed it)
    LoyaltyRewardRedemption.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'processor'
    });
  };

  return LoyaltyRewardRedemption;
}; 