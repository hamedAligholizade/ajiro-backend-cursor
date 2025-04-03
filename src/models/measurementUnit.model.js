const { DataTypes } = require('sequelize');

/**
 * Measurement Unit model for product measurements
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - MeasurementUnit model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     MeasurementUnit:
   *       type: object
   *       required:
   *         - name
   *         - shop_id
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated unit ID
   *         name:
   *           type: string
   *           description: Unit name (e.g., kg, liter, piece)
   *         abbreviation:
   *           type: string
   *           description: Short form of the unit (e.g., kg, L, pc)
   *         shop_id:
   *           type: string
   *           format: uuid
   *           description: ID of the shop this unit belongs to
   *         is_active:
   *           type: boolean
   *           description: Whether the unit is active
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const MeasurementUnit = sequelize.define('MeasurementUnit', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    abbreviation: {
      type: DataTypes.STRING(10)
    },
    shop_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shops',
        key: 'id'
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'measurement_units',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Define associations
  MeasurementUnit.associate = (models) => {
    // MeasurementUnit belongs to Shop
    MeasurementUnit.belongsTo(models.Shop, {
      foreignKey: 'shop_id',
      as: 'shop'
    });
  };

  return MeasurementUnit;
}; 