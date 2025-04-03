const { DataTypes } = require('sequelize');

/**
 * InventoryTransaction model for tracking inventory movements
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - InventoryTransaction model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     InventoryTransaction:
   *       type: object
   *       required:
   *         - product_id
   *         - quantity
   *         - transaction_type
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated transaction ID
   *         product_id:
   *           type: string
   *           format: uuid
   *           description: ID of the product this transaction affects
   *         quantity:
   *           type: integer
   *           description: Quantity change
   *         transaction_type:
   *           type: string
   *           enum: [purchase, sale, return, adjustment, transfer]
   *           description: Type of transaction
   *         reference_id:
   *           type: string
   *           format: uuid
   *           description: ID of the related entity (sale, purchase order, etc.)
   *         note:
   *           type: string
   *           description: Note about the transaction
   *         user_id:
   *           type: string
   *           format: uuid
   *           description: ID of the user who performed this transaction
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   */
  const InventoryTransaction = sequelize.define('InventoryTransaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.ENUM('purchase', 'sale', 'return', 'adjustment', 'transfer'),
      allowNull: false
    },
    reference_id: {
      type: DataTypes.UUID
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
    tableName: 'inventory_transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at timestamp for transactions
    paranoid: false, // Explicitly disable soft deletes
    
    // Indexes
    indexes: [
      {
        name: 'idx_inventory_transactions_product_id',
        fields: ['product_id']
      },
      {
        name: 'idx_inventory_transactions_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_inventory_transactions_reference_id',
        fields: ['reference_id']
      }
    ]
  });

  // Define associations
  InventoryTransaction.associate = (models) => {
    // InventoryTransaction belongs to Product
    InventoryTransaction.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });

    // InventoryTransaction belongs to User
    InventoryTransaction.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return InventoryTransaction;
}; 