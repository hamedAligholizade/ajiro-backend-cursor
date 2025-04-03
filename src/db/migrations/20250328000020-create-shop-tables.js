/**
 * Migration for creating shop-related tables
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Create shops table
    await queryInterface.createTable('shops', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      owner_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      business_type: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true
      },
      tax_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 9.00,
        allowNull: false
      },
      currency: {
        type: DataTypes.STRING(10),
        defaultValue: 'تومان',
        allowNull: false
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

    // Create user_shops table for user-shop relationships
    await queryInterface.createTable('user_shops', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
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
      permissions: {
        type: DataTypes.JSONB,
        defaultValue: {},
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
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    // Create unique index to prevent duplicate user-shop relationships
    await queryInterface.addIndex('user_shops', ['user_id', 'shop_id'], {
      unique: true,
      where: {
        deleted_at: null
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_shops');
    await queryInterface.dropTable('shops');
  }
}; 