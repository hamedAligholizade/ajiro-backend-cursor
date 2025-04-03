/**
 * Migration to add unit_id column to products table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Add unit_id column to products table
    await queryInterface.addColumn('products', 'unit_id', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'units',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove unit_id column from products table
    await queryInterface.removeColumn('products', 'unit_id');
  }
}; 