/**
 * Migration for creating product and category related tables
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { DataTypes } = Sequelize;
    
    // Create categories table
    await queryInterface.createTable('categories', {
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

    // Create products table
    await queryInterface.createTable('products', {
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
      sku: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      barcode: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      selling_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false
      },
      purchase_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
      },
      discount_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true
      },
      category_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      in_stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      min_stock: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      is_taxable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      tax_rate: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
      },
      image_url: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      weight: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true
      },
      weight_unit: {
        type: DataTypes.STRING(10),
        allowNull: true
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('categories');
  }
}; 