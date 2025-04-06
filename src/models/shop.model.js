const { DataTypes } = require('sequelize');

/**
 * Shop model
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize/types').DataTypes} DataTypes - Sequelize data types
 * @returns {import('sequelize').Model} - Shop model
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     Shop:
   *       type: object
   *       required:
   *         - name
   *         - owner_id
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated shop ID
   *         name:
   *           type: string
   *           description: Shop name
   *         description:
   *           type: string
   *           description: Shop description
   *         owner_id:
   *           type: string
   *           format: uuid
   *           description: Owner user ID
   *         business_type:
   *           type: string
   *           description: Type of business (e.g., retail, restaurant)
   *         address:
   *           type: string
   *           description: Shop physical address
   *         phone:
   *           type: string
   *           description: Shop contact phone
   *         is_active:
   *           type: boolean
   *           description: Whether the shop is active
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const Shop = sequelize.define('Shop', {
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
    owner_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    business_type: {
      type: DataTypes.STRING(50)
    },
    address: {
      type: DataTypes.STRING(255)
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    tax_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 9.00
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: 'تومان'
    }
  }, {
    tableName: 'shops',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  // Define associations in the associate method - will be called in index.js
  Shop.associate = (models) => {
    // A shop belongs to a user (owner)
    Shop.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'owner'
    });
    
    // A shop has many categories
    Shop.hasMany(models.Category, {
      foreignKey: 'shop_id',
      as: 'categories'
    });
    
    // A shop has many products
    Shop.hasMany(models.Product, {
      foreignKey: 'shop_id',
      as: 'products'
    });
    
    // A shop has many inventory items
    Shop.hasMany(models.Inventory, {
      foreignKey: 'shop_id',
      as: 'inventory'
    });
    
    // A shop has many staff members
    Shop.hasMany(models.ShopStaff, {
      foreignKey: 'shop_id',
      as: 'staff'
    });
  };
  
  return Shop;
}; 