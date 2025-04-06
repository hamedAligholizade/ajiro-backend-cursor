/**
 * Migration for creating inventory table and inventory_transactions table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Create inventory table
    await queryInterface.createTable('inventory', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      stock_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      available_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      reserved_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      reorder_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      reorder_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      },
      location: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    // Create inventory_transactions table
    await queryInterface.createTable('inventory_transactions', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      transaction_type: {
        type: DataTypes.ENUM('purchase', 'sale', 'adjustment', 'return', 'transfer', 'delivery'),
        allowNull: false
      },
      reference_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Reference to related entity (order_id, purchase_id, etc.)'
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('inventory', ['product_id'], {
      unique: true,
      name: 'idx_inventory_product_id'
    });

    await queryInterface.addIndex('inventory_transactions', ['product_id'], {
      name: 'idx_inventory_transactions_product_id'
    });

    await queryInterface.addIndex('inventory_transactions', ['user_id'], {
      name: 'idx_inventory_transactions_user_id'
    });

    await queryInterface.addIndex('inventory_transactions', ['reference_id'], {
      name: 'idx_inventory_transactions_reference_id'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inventory_transactions');
    await queryInterface.dropTable('inventory');
  }
}; 