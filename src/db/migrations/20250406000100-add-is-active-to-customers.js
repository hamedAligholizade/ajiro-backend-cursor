/**
 * Migration to add is_active column to customers table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Check if is_active column exists in customers table
    const tableInfo = await queryInterface.describeTable('customers');
    
    // If the column doesn't exist, add it
    if (!tableInfo.is_active) {
      await queryInterface.addColumn('customers', 'is_active', {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if is_active column exists before removing
    const tableInfo = await queryInterface.describeTable('customers');
    
    if (tableInfo.is_active) {
      await queryInterface.removeColumn('customers', 'is_active');
    }
  }
}; 