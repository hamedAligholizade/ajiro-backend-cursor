const { DataTypes } = require('sequelize');

/**
 * OrderItem model for order items
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - OrderItem model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     OrderItem:
   *       type: object
   *       required:
   *         - order_id
   *         - product_id
   *         - quantity
   *         - unit_price
   *         - total_price
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated order item ID
   *         order_id:
   *           type: string
   *           format: uuid
   *           description: ID of the order this item belongs to
   *         product_id:
   *           type: string
   *           format: uuid
   *           description: ID of the product
   *         quantity:
   *           type: integer
   *           description: Quantity of the product
   *         unit_price:
   *           type: number
   *           format: float
   *           description: Price per unit
   *         total_price:
   *           type: number
   *           format: float
   *           description: Total price for this item
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   */
  const OrderItem = sequelize.define('OrderItem', {
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
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    }
  }, {
    tableName: 'order_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at for order items
    
    // Hooks
    hooks: {
      beforeValidate: (item) => {
        // Calculate total price if not provided
        if (!item.total_price && item.unit_price && item.quantity) {
          item.total_price = parseFloat(item.unit_price) * item.quantity;
        }
      }
    }
  });

  // Define associations
  OrderItem.associate = (models) => {
    // OrderItem belongs to Order
    if (models.Order) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'order_id',
        as: 'order'
      });
    }

    // OrderItem belongs to Product
    if (models.Product) {
      OrderItem.belongsTo(models.Product, {
        foreignKey: 'product_id',
        as: 'product'
      });
    }
  };

  return OrderItem;
}; 