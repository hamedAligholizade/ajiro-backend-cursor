const { DataTypes } = require('sequelize');

/**
 * Inventory model for tracking product stock levels
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - Inventory model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     Inventory:
   *       type: object
   *       required:
   *         - product_id
   *         - stock_quantity
   *         - available_quantity
   *         - reserved_quantity
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated inventory ID
   *         product_id:
   *           type: string
   *           format: uuid
   *           description: ID of the product this inventory belongs to
   *         stock_quantity:
   *           type: integer
   *           description: Total stock quantity
   *         available_quantity:
   *           type: integer
   *           description: Available stock quantity
   *         reserved_quantity:
   *           type: integer
   *           description: Reserved stock quantity
   *         reorder_level:
   *           type: integer
   *           description: Minimum stock level before reordering
   *         reorder_quantity:
   *           type: integer
   *           description: Quantity to reorder when reaching reorder level
   *         location:
   *           type: string
   *           description: Physical location of the inventory
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const Inventory = sequelize.define('Inventory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    available_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    reserved_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    reorder_level: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0
      }
    },
    reorder_quantity: {
      type: DataTypes.INTEGER,
      validate: {
        min: 0
      }
    },
    location: {
      type: DataTypes.STRING(100)
    }
  }, {
    tableName: 'inventory',
    timestamps: true,
    createdAt: false, // No created_at timestamp for inventory
    updatedAt: 'updated_at',
    paranoid: false, // Explicitly disable soft deletes since we don't have deleted_at column
    
    // Hooks
    hooks: {
      afterUpdate: async (inventory) => {
        // Check if inventory is below reorder level
        if (inventory.reorder_level && inventory.stock_quantity <= inventory.reorder_level) {
          // In a real application, you might want to send notifications
          // or create purchase orders when inventory is low
          console.log(`Low inventory alert: Product ID ${inventory.product_id} is below reorder level.`);
        }
      }
    }
  });

  // Define associations
  Inventory.associate = (models) => {
    // Inventory belongs to Product
    Inventory.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  return Inventory;
}; 