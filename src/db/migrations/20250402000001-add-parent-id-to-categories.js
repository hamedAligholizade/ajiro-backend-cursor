'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Add parent_id column to categories table
    await queryInterface.addColumn('categories', 'parent_id', {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id'
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    
    // Add image_url and is_active columns which are in the model but missing in the table
    await queryInterface.addColumn('categories', 'image_url', {
      type: DataTypes.TEXT,
      allowNull: true
    });
    
    if (!(await columnExists(queryInterface, 'categories', 'is_active'))) {
      await queryInterface.addColumn('categories', 'is_active', {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns
    await queryInterface.removeColumn('categories', 'parent_id');
    await queryInterface.removeColumn('categories', 'image_url');
    
    // Check if is_active exists before removing
    if (await columnExists(queryInterface, 'categories', 'is_active')) {
      await queryInterface.removeColumn('categories', 'is_active');
    }
  }
};

// Helper function to check if a column exists
async function columnExists(queryInterface, tableName, columnName) {
  try {
    // Use raw query to check if column exists in PostgreSQL
    const result = await queryInterface.sequelize.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      AND column_name = '${columnName}'
    `);
    return result[0].length > 0;
  } catch (error) {
    console.error(`Error checking if column ${columnName} exists in ${tableName}:`, error);
    return false;
  }
} 