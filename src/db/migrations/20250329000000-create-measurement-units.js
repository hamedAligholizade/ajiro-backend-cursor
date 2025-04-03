/**
 * Migration for creating measurement units table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Create measurement_units table
    await queryInterface.createTable('measurement_units', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      abbreviation: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'shops',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    // Create index for faster lookups by shop
    await queryInterface.addIndex('measurement_units', ['shop_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('measurement_units');
  }
}; 