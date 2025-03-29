const { DataTypes } = require('sequelize');

/**
 * Supplier model for supplier management
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @param {import('sequelize/types').DataTypes} DataTypes - Sequelize data types
 * @returns {import('sequelize').Model} - Supplier model
 */
module.exports = (sequelize, DataTypes) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     Supplier:
   *       type: object
   *       required:
   *         - name
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated supplier ID
   *         name:
   *           type: string
   *           description: Supplier company name
   *         contact_name:
   *           type: string
   *           description: Name of the contact person
   *         email:
   *           type: string
   *           format: email
   *           description: Supplier's email address
   *         phone:
   *           type: string
   *           description: Supplier's phone number
   *         address:
   *           type: string
   *           description: Supplier's address
   *         is_active:
   *           type: boolean
   *           description: Whether the supplier is active
   *         notes:
   *           type: string
   *           description: Additional notes about the supplier
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const Supplier = sequelize.define('Supplier', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    contact_name: {
      type: DataTypes.STRING(100)
    },
    email: {
      type: DataTypes.STRING(255),
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    address: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'suppliers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Define associations
  Supplier.associate = (models) => {
    // Supplier has many PurchaseOrders if the model exists
    if (models.PurchaseOrder) {
      Supplier.hasMany(models.PurchaseOrder, {
        foreignKey: 'supplier_id',
        as: 'purchase_orders'
      });
    }
  };

  return Supplier;
}; 