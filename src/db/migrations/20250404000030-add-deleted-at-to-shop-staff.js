/**
 * Migration to add deleted_at column to shop_staff table to support soft deletes
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    await queryInterface.addColumn('shop_staff', 'deleted_at', {
      type: DataTypes.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('shop_staff', 'deleted_at');
  }
}; 