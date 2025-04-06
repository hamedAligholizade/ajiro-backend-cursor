/**
 * Migration to add shop_id to categories, products, and inventory tables to implement multi-shop support
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Add shop_id to categories table
    await queryInterface.addColumn('categories', 'shop_id', {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shops',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Add shop_id to products table
    await queryInterface.addColumn('products', 'shop_id', {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shops',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Add shop_id to inventory table
    await queryInterface.addColumn('inventory', 'shop_id', {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shops',
        key: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Create composite indexes for better query performance
    await queryInterface.addIndex('categories', ['shop_id', 'name'], {
      name: 'categories_shop_id_name_idx'
    });

    await queryInterface.addIndex('products', ['shop_id', 'name'], {
      name: 'products_shop_id_name_idx'
    });

    await queryInterface.addIndex('products', ['shop_id', 'sku'], {
      name: 'products_shop_id_sku_idx',
      unique: true
    });

    await queryInterface.addIndex('inventory', ['shop_id', 'product_id'], {
      name: 'inventory_shop_id_product_id_idx',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('categories', 'categories_shop_id_name_idx');
    await queryInterface.removeIndex('products', 'products_shop_id_name_idx');
    await queryInterface.removeIndex('products', 'products_shop_id_sku_idx');
    await queryInterface.removeIndex('inventory', 'inventory_shop_id_product_id_idx');
    
    // Remove columns
    await queryInterface.removeColumn('inventory', 'shop_id');
    await queryInterface.removeColumn('products', 'shop_id');
    await queryInterface.removeColumn('categories', 'shop_id');
  }
}; 