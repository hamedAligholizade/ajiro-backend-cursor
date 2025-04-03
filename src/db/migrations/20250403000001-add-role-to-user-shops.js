/**
 * Migration to add role column to user_shops table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add role ENUM type
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_user_shops_role" AS ENUM (
        'admin', 
        'manager', 
        'cashier', 
        'inventory', 
        'marketing'
      );
    `);

    // Add role column to user_shops table
    await queryInterface.addColumn('user_shops', 'role', {
      type: Sequelize.DataTypes.ENUM,
      values: ['admin', 'manager', 'cashier', 'inventory', 'marketing'],
      defaultValue: 'cashier',
      allowNull: false
    });

    // Set role to 'admin' for records where user_id = shop.owner_id
    await queryInterface.sequelize.query(`
      UPDATE user_shops 
      SET role = 'admin' 
      FROM shops 
      WHERE user_shops.shop_id = shops.id 
      AND user_shops.user_id = shops.owner_id
    `);

    // Set role to 'cashier' for all other existing records
    await queryInterface.sequelize.query(`
      UPDATE user_shops 
      SET role = 'cashier' 
      WHERE role IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the role column
    await queryInterface.removeColumn('user_shops', 'role');
    
    // Drop the ENUM type
    await queryInterface.sequelize.query(`DROP TYPE "enum_user_shops_role";`);
  }
}; 