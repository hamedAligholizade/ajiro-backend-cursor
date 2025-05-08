const { DataTypes } = require('sequelize');

/**
 * PreRegister model for managing pre-registration requests
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - PreRegister model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     PreRegister:
   *       type: object
   *       required:
   *         - full_name
   *         - email
   *         - phone
   *         - instagram_id
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated pre-registration ID
   *         full_name:
   *           type: string
   *           description: Full name of the applicant
   *         email:
   *           type: string
   *           format: email
   *           description: Email address of the applicant
   *         phone:
   *           type: string
   *           description: Phone number of the applicant
   *         instagram_id:
   *           type: string
   *           description: Instagram username of the applicant
   *         status:
   *           type: string
   *           enum: [pending, approved, rejected]
   *           description: Current status of the pre-registration
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const PreRegister = sequelize.define('PreRegister', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true
    },
    instagram_id: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending'
    }
  }, {
    tableName: 'pre_registers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: false,
  });

  // Define associations
  PreRegister.associate = (models) => {
    // Add any associations here if needed in the future
  };

  return PreRegister;
}; 