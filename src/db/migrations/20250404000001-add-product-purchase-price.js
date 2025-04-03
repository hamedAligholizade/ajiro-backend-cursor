/**
 * Migration to add purchase_price column to products table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Check if purchase_price column exists
    try {
      const tableInfo = await queryInterface.describeTable('products');
      
      // If cost_price exists but purchase_price doesn't, rename it
      if (tableInfo.cost_price && !tableInfo.purchase_price) {
        await queryInterface.renameColumn('products', 'cost_price', 'purchase_price');
      } 
      // If neither exists, add purchase_price
      else if (!tableInfo.purchase_price) {
        await queryInterface.addColumn('products', 'purchase_price', {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true
        });
      }
      
      // Check and add other required columns
      if (!tableInfo.discount_price) {
        await queryInterface.addColumn('products', 'discount_price', {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: true
        });
      }
      
      if (!tableInfo.is_taxable) {
        await queryInterface.addColumn('products', 'is_taxable', {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        });
      }
      
      if (!tableInfo.tax_rate) {
        await queryInterface.addColumn('products', 'tax_rate', {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: true
        });
      }
      
      if (!tableInfo.image_url) {
        await queryInterface.addColumn('products', 'image_url', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      
      if (!tableInfo.weight) {
        await queryInterface.addColumn('products', 'weight', {
          type: DataTypes.DECIMAL(8, 2),
          allowNull: true
        });
      }
      
      if (!tableInfo.weight_unit) {
        await queryInterface.addColumn('products', 'weight_unit', {
          type: DataTypes.STRING(10),
          allowNull: true
        });
      }
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      const tableInfo = await queryInterface.describeTable('products');
      
      // Remove columns in reverse order
      if (tableInfo.weight_unit) {
        await queryInterface.removeColumn('products', 'weight_unit');
      }
      
      if (tableInfo.weight) {
        await queryInterface.removeColumn('products', 'weight');
      }
      
      if (tableInfo.image_url) {
        await queryInterface.removeColumn('products', 'image_url');
      }
      
      if (tableInfo.tax_rate) {
        await queryInterface.removeColumn('products', 'tax_rate');
      }
      
      if (tableInfo.is_taxable) {
        await queryInterface.removeColumn('products', 'is_taxable');
      }
      
      if (tableInfo.discount_price) {
        await queryInterface.removeColumn('products', 'discount_price');
      }
      
      if (tableInfo.purchase_price) {
        // Rename back to cost_price if it was renamed
        await queryInterface.renameColumn('products', 'purchase_price', 'cost_price');
      }
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
}; 