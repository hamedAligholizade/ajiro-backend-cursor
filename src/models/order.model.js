const { DataTypes } = require('sequelize');

/**
 * Order model for order management
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - Order model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     Order:
   *       type: object
   *       required:
   *         - status
   *         - order_date
   *         - total_amount
   *         - payment_status
   *         - shop_id
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated order ID
   *         order_number:
   *           type: string
   *           description: Unique order number (generated)
   *         customer_id:
   *           type: string
   *           format: uuid
   *           description: ID of the customer who placed the order
   *         shop_id:
   *           type: string
   *           format: uuid
   *           description: ID of the shop this order belongs to
   *         status:
   *           type: string
   *           enum: [pending, processing, shipped, delivered, cancelled]
   *           description: Order status
   *         order_date:
   *           type: string
   *           format: date-time
   *           description: When the order was placed
   *         delivery_date:
   *           type: string
   *           format: date-time
   *           description: When the order was delivered
   *         total_amount:
   *           type: number
   *           format: float
   *           description: Total order amount
   *         payment_status:
   *           type: string
   *           enum: [pending, paid, partial, refunded]
   *           description: Payment status
   *         shipping_address:
   *           type: string
   *           description: Shipping address
   *         shipping_method:
   *           type: string
   *           description: Shipping method
   *         tracking_number:
   *           type: string
   *           description: Tracking number for shipped orders
   *         notes:
   *           type: string
   *           description: Additional notes about the order
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    order_number: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    customer_id: {
      type: DataTypes.UUID,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    shop_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shops',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    delivery_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'paid', 'partial', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    shipping_address: {
      type: DataTypes.TEXT
    },
    shipping_method: {
      type: DataTypes.STRING(100)
    },
    tracking_number: {
      type: DataTypes.STRING(100)
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
    
    // Hooks
    hooks: {
      beforeCreate: async (order) => {
        // Generate order number if not provided
        if (!order.order_number) {
          const timestamp = Date.now().toString().substring(4); // Use timestamp for uniqueness
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // Add random digits
          order.order_number = `ORD-${timestamp}-${random}`;
        }
      }
    }
  });

  // Define associations
  Order.associate = (models) => {
    // Order belongs to Customer
    if (models.Customer) {
      Order.belongsTo(models.Customer, {
        foreignKey: 'customer_id',
        as: 'customer'
      });
    }
    
    // Order belongs to Shop
    if (models.Shop) {
      Order.belongsTo(models.Shop, {
        foreignKey: 'shop_id',
        as: 'shop'
      });
    }

    // Order has many OrderItems
    if (models.OrderItem) {
      Order.hasMany(models.OrderItem, {
        foreignKey: 'order_id',
        as: 'items'
      });
    }

    // Order has many OrderStatusHistory
    if (models.OrderStatusHistory) {
      Order.hasMany(models.OrderStatusHistory, {
        foreignKey: 'order_id',
        as: 'status_history'
      });
    }
  };

  // Instance methods
  Order.prototype.calculateTotals = async function() {
    // This method would recalculate the total based on order items
    // Would be implemented when OrderItems model is available
  };

  return Order;
}; 