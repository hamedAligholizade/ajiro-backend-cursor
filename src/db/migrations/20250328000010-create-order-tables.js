'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create orders table
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        primaryKey: true
      },
      order_number: {
        type: Sequelize.DataTypes.STRING(50),
        unique: true,
        allowNull: false
      },
      customer_id: {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      order_date: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.DataTypes.NOW
      },
      total_amount: {
        type: Sequelize.DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0
      },
      payment_status: {
        type: Sequelize.DataTypes.ENUM('pending', 'paid', 'partial', 'refunded'),
        allowNull: false,
        defaultValue: 'pending'
      },
      shipping_address: {
        type: Sequelize.DataTypes.TEXT
      },
      shipping_method: {
        type: Sequelize.DataTypes.STRING(100)
      },
      tracking_number: {
        type: Sequelize.DataTypes.STRING(100)
      },
      notes: {
        type: Sequelize.DataTypes.TEXT
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.DataTypes.NOW
      },
      updated_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.DataTypes.NOW
      },
      deleted_at: {
        type: Sequelize.DataTypes.DATE
      }
    });

    // Create order_items table
    await queryInterface.createTable('order_items', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        primaryKey: true
      },
      order_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      quantity: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1
        }
      },
      unit_price: {
        type: Sequelize.DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      total_price: {
        type: Sequelize.DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.DataTypes.NOW
      },
      deleted_at: {
        type: Sequelize.DataTypes.DATE
      }
    });

    // Create order_status_history table
    await queryInterface.createTable('order_status_history', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        primaryKey: true
      },
      order_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
        allowNull: false
      },
      note: {
        type: Sequelize.DataTypes.TEXT
      },
      user_id: {
        type: Sequelize.DataTypes.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.DataTypes.NOW
      }
    });

    // Create indexes for performance
    await queryInterface.addIndex('orders', ['customer_id']);
    await queryInterface.addIndex('orders', ['status']);
    await queryInterface.addIndex('orders', ['order_date']);
    await queryInterface.addIndex('orders', ['payment_status']);
    await queryInterface.addIndex('order_items', ['order_id']);
    await queryInterface.addIndex('order_items', ['product_id']);
    await queryInterface.addIndex('order_status_history', ['order_id']);
    await queryInterface.addIndex('order_status_history', ['status']);
    await queryInterface.addIndex('order_status_history', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('order_status_history');
    await queryInterface.dropTable('order_items');
    await queryInterface.dropTable('orders');
    
    // Drop ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_orders_payment_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_order_status_history_status";');
  }
}; 