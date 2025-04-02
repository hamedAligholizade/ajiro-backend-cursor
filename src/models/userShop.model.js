const { DataTypes } = require('sequelize');

/**
 * UserShop join model to manage user access to multiple shops
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize/types').DataTypes} DataTypes - Sequelize data types
 * @returns {import('sequelize').Model} - UserShop model
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     UserShop:
   *       type: object
   *       required:
   *         - user_id
   *         - shop_id
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated ID for this relationship
   *         user_id:
   *           type: string
   *           format: uuid
   *           description: User ID
   *         shop_id:
   *           type: string
   *           format: uuid
   *           description: Shop ID
   *         permissions:
   *           type: array
   *           items:
   *             type: string
   *           description: Array of permissions for this user in this shop
   *         is_active:
   *           type: boolean
   *           description: Whether this user's access to this shop is active
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const UserShop = sequelize.define('UserShop', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
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
    permissions: {
      type: DataTypes.JSON, // Store array of permission strings
      defaultValue: []
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'user_shops',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  
  return UserShop;
}; 