/**
 * Migration to create shop_staff table for tracking shop staff members
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Create ENUM type for staff roles
    await queryInterface.sequelize.query(
      `CREATE TYPE enum_shop_staff_role AS ENUM ('admin', 'manager', 'cashier', 'inventory', 'marketing')`
    );
    
    // Create shop_staff table
    await queryInterface.createTable('shop_staff', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'shops',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      role: {
        type: 'enum_shop_staff_role',
        allowNull: false
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
      }
    });
    
    // Add unique constraint to prevent duplicate shop-user pairs
    await queryInterface.addConstraint('shop_staff', {
      fields: ['shop_id', 'user_id'],
      type: 'unique',
      name: 'shop_staff_shop_id_user_id_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Drop the table
    await queryInterface.dropTable('shop_staff');
    
    // Drop the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_shop_staff_role');
  }
}; 