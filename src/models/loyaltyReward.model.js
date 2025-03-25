const { DataTypes } = require('sequelize');

/**
 * LoyaltyReward model for loyalty program rewards
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - LoyaltyReward model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     LoyaltyReward:
   *       type: object
   *       required:
   *         - name
   *         - points_required
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated reward ID
   *         name:
   *           type: string
   *           description: Name of the reward
   *         description:
   *           type: string
   *           description: Detailed description of the reward
   *         points_required:
   *           type: integer
   *           description: Points required to redeem this reward
   *         reward_type:
   *           type: string
   *           enum: [discount, free_product, gift, service]
   *           description: Type of reward
   *         discount_amount:
   *           type: number
   *           format: decimal
   *           description: Discount amount (if reward_type is 'discount')
   *         discount_percent:
   *           type: number
   *           format: decimal
   *           description: Discount percentage (if reward_type is 'discount')
   *         product_id:
   *           type: string
   *           format: uuid
   *           description: ID of the free product (if reward_type is 'free_product')
   *         is_active:
   *           type: boolean
   *           description: Whether the reward is active
   *         min_tier:
   *           type: string
   *           enum: [bronze, silver, gold, platinum]
   *           description: Minimum loyalty tier required
   *         image_url:
   *           type: string
   *           description: URL to reward image
   *         start_date:
   *           type: string
   *           format: date
   *           description: Start date of reward availability
   *         end_date:
   *           type: string
   *           format: date
   *           description: End date of reward availability
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const LoyaltyReward = sequelize.define('LoyaltyReward', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    points_required: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    reward_type: {
      type: DataTypes.ENUM('discount', 'free_product', 'gift', 'service'),
      defaultValue: 'discount'
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2)
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2)
    },
    product_id: {
      type: DataTypes.UUID,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    min_tier: {
      type: DataTypes.ENUM('bronze', 'silver', 'gold', 'platinum'),
      defaultValue: 'bronze'
    },
    image_url: {
      type: DataTypes.TEXT
    },
    start_date: {
      type: DataTypes.DATEONLY
    },
    end_date: {
      type: DataTypes.DATEONLY
    }
  }, {
    tableName: 'loyalty_rewards',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Define associations
  LoyaltyReward.associate = (models) => {
    // LoyaltyReward has many LoyaltyRewardRedemptions
    LoyaltyReward.hasMany(models.LoyaltyRewardRedemption, {
      foreignKey: 'reward_id',
      as: 'redemptions'
    });

    // LoyaltyReward may belong to Product (for free product rewards)
    LoyaltyReward.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return LoyaltyReward;
}; 