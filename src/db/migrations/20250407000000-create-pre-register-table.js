const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.createTable('pre_registers', {
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
        unique: true
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
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Add indexes
    await queryInterface.addIndex('pre_registers', ['email']);
    await queryInterface.addIndex('pre_registers', ['phone']);
    await queryInterface.addIndex('pre_registers', ['status']);
    await queryInterface.addIndex('pre_registers', ['created_at']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('pre_registers');
  }
}; 