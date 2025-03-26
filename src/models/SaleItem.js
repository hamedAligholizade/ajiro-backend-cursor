module.exports = (sequelize, DataTypes) => {
  const SaleItem = sequelize.define('SaleItem', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    sale_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Sales',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 100
      }
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    tax_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00,
      validate: {
        min: 0
      }
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    }
  }, {
    tableName: 'sale_items',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_sale_items_sale_id',
        fields: ['sale_id']
      },
      {
        name: 'idx_sale_items_product_id',
        fields: ['product_id']
      }
    ]
  });

  SaleItem.associate = function(models) {
    // SaleItem belongs to Sale
    SaleItem.belongsTo(models.Sale, {
      foreignKey: 'sale_id',
      as: 'sale'
    });

    // SaleItem belongs to Product
    SaleItem.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product'
    });
  };

  // Hook to update inventory after sale item is created
  SaleItem.afterCreate(async (saleItem, options) => {
    if (options.transaction) {
      const models = sequelize.models;
      
      // Find the product's inventory
      const inventory = await models.Inventory.findOne({
        where: { product_id: saleItem.product_id },
        transaction: options.transaction
      });

      if (inventory) {
        // Decrease the available quantity
        await inventory.decrement('available_quantity', {
          by: saleItem.quantity,
          transaction: options.transaction
        });
        
        // Add inventory transaction record
        await models.InventoryTransaction.create({
          inventory_id: inventory.id,
          product_id: saleItem.product_id,
          quantity: -saleItem.quantity,
          type: 'sale',
          reference_id: saleItem.sale_id,
          user_id: options.user_id || null,
          notes: `Sale item: ${saleItem.id}`
        }, { transaction: options.transaction });
      }
    }
  });

  return SaleItem;
}; 