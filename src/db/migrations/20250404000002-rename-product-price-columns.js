/**
 * Migration to rename price to selling_price in products table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('products');
      
      // If price exists but selling_price doesn't, rename it
      if (tableInfo.price && !tableInfo.selling_price) {
        await queryInterface.renameColumn('products', 'price', 'selling_price');
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('products');
      
      // If selling_price exists and price doesn't, rename it back
      if (tableInfo.selling_price && !tableInfo.price) {
        await queryInterface.renameColumn('products', 'selling_price', 'price');
      }
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
}; 