const { DataTypes } = require('sequelize');

/**
 * SaleItem model for individual line items within a sale
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - SaleItem model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     SaleItem:
   *       type: object
   *       required:
   *         - sale_id
   *         - product_id
   *         - quantity
   *         - unit_price
   *         - subtotal
   *         - total
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated sale item ID
   *         sale_id:
   *           type: string
   *           format: uuid
   *           description: ID of the sale this item belongs to
   *         product_id:
   *           type: string
   *           format: uuid
   *           description: ID of the product sold
   *         quantity:
   *           type: integer
   *           description: Quantity of product sold
   *         unit_price:
   *           type: number
   *           format: decimal
   *           description: Unit price of the product at time of sale
   *         discount_percent:
   *           type: number
   *           format: decimal
   *           description: Discount percentage for this item
   *         discount_amount:
   *           type: number
   *           format: decimal
   *           description: Discount amount for this item
   *         tax_percent:
   *           type: number
   *           format: decimal
   *           description: Tax percentage applied to this item
   *         tax_amount:
   *           type: number
   *           format: decimal
   *           description: Total tax amount for this item
   *         subtotal:
   *           type: number
   *           format: decimal
   *           description: Subtotal for this item (quantity * unit_price)
   *         total:
   *           type: number
   *           format: decimal
   *           description: Total for this item (subtotal + tax - discount)
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   */
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
        model: 'sales',
        key: 'id'
      }
    },
    product_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    tax_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    }
  }, {
    tableName: 'sale_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // No updated_at for sale items
    
    // Hooks
    hooks: {
      beforeValidate: (saleItem) => {
        // Calculate derived fields if not provided
        if (!saleItem.subtotal) {
          saleItem.subtotal = saleItem.quantity * saleItem.unit_price;
        }
        
        if (!saleItem.discount_amount && saleItem.discount_percent) {
          saleItem.discount_amount = (saleItem.subtotal * saleItem.discount_percent) / 100;
        }
        
        if (!saleItem.tax_amount && saleItem.tax_percent) {
          // Tax is typically calculated after discount
          const afterDiscount = saleItem.subtotal - saleItem.discount_amount;
          saleItem.tax_amount = (afterDiscount * saleItem.tax_percent) / 100;
        }
        
        if (!saleItem.total) {
          saleItem.total = saleItem.subtotal - saleItem.discount_amount + saleItem.tax_amount;
        }
      },
      
      afterCreate: async (saleItem, options) => {
        // Update inventory quantity
        try {
          const { Inventory, InventoryTransaction } = require('./index');
          
          // Reduce inventory
          const inventory = await Inventory.findOne({
            where: { product_id: saleItem.product_id }
          });
          
          if (inventory) {
            // Update the available and reserved quantities
            await inventory.decrement('stock_quantity', { 
              by: saleItem.quantity,
              transaction: options.transaction 
            });
            
            await inventory.decrement('available_quantity', { 
              by: saleItem.quantity,
              transaction: options.transaction 
            });
            
            // Record inventory transaction
            await InventoryTransaction.create({
              product_id: saleItem.product_id,
              quantity: -saleItem.quantity,
              transaction_type: 'sale',
              reference_id: saleItem.sale_id,
              note: `Sale item for sale ${saleItem.sale_id}`,
              user_id: options.user_id // This should be passed from the controller
            }, { transaction: options.transaction });
          }
        } catch (error) {
          console.error('Error updating inventory:', error);
        }
      }
    }
  });

  // Define associations
  SaleItem.associate = (models) => {
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

  return SaleItem;
}; 