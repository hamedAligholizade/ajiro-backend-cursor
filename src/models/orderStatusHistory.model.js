const { DataTypes } = require('sequelize');

/**
 * OrderStatusHistory model for tracking order status changes
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - OrderStatusHistory model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     OrderStatusHistory:
   *       type: object
   *       required:
   *         - order_id
   *         - status
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated record ID
   *         order_id:
   *           type: string
   *           format: uuid
   *           description: ID of the order this status change belongs to
   *         status:
   *           type: string
   *           enum: [pending, processing, shipped, delivered, cancelled]
   *           description: Order status
   *         note:
   *           type: string
   *           description: Note about the status change
   *         user_id:
   *           type: string
   *           format: uuid
   *           description: ID of the user who made the status change
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: When the status change was made
   */
  const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
      allowNull: false
    },
    note: {
      type: DataTypes.TEXT
    },
    user_id: {
      type: DataTypes.UUID,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'order_status_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at for status history
    paranoid: false,
  });

  // Define associations
  OrderStatusHistory.associate = (models) => {
    // OrderStatusHistory belongs to Order
    if (models.Order) {
      OrderStatusHistory.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });
    }

    // OrderStatusHistory belongs to User
    if (models.User) {
      OrderStatusHistory.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user'
      });
    }
  };

  return OrderStatusHistory;
}; 