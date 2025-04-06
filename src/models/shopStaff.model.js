const { DataTypes } = require('sequelize');

/**
 * ShopStaff model for shop staff members
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - ShopStaff model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     ShopStaff:
   *       type: object
   *       required:
   *         - shop_id
   *         - user_id
   *         - role
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated ID
   *         shop_id:
   *           type: string
   *           format: uuid
   *           description: The shop ID
   *         user_id:
   *           type: string
   *           format: uuid
   *           description: The user ID
   *         role:
   *           type: string
   *           enum: [admin, manager, cashier, inventory, marketing]
   *           description: Role in the shop
   *         is_active:
   *           type: boolean
   *           description: Whether the staff is active
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const ShopStaff = sequelize.define('ShopStaff', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    shop_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shops',
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
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'cashier', 'inventory', 'marketing'),
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'shop_staff',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  // Define associations
  ShopStaff.associate = (models) => {
    // ShopStaff belongs to Shop
    ShopStaff.belongsTo(models.Shop, {
      foreignKey: 'shop_id',
      as: 'shop'
    });

    // ShopStaff belongs to User
    ShopStaff.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return ShopStaff;
}; 