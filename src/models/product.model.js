const { DataTypes } = require('sequelize');

/**
 * Product model for items and services sold through the system
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - Product model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     Product:
   *       type: object
   *       required:
   *         - name
   *         - selling_price
   *         - category_id
   *         - shop_id
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated product ID
   *         name:
   *           type: string
   *           description: Product name
   *         sku:
   *           type: string
   *           description: Stock keeping unit (unique)
   *         barcode:
   *           type: string
   *           description: Product barcode (unique)
   *         description:
   *           type: string
   *           description: Detailed product description
   *         category_id:
   *           type: string
   *           format: uuid
   *           description: ID of the product category
   *         shop_id:
   *           type: string
   *           format: uuid
   *           description: ID of the shop this product belongs to
   *         unit_id:
   *           type: integer
   *           description: ID of the measurement unit
   *         purchase_price:
   *           type: number
   *           format: decimal
   *           description: Cost price/purchase price
   *         selling_price:
   *           type: number
   *           format: decimal
   *           description: Selling price
   *         discount_price:
   *           type: number
   *           format: decimal
   *           description: Discounted selling price
   *         is_taxable:
   *           type: boolean
   *           description: Whether the product is taxable
   *         tax_rate:
   *           type: number
   *           format: decimal
   *           description: Tax rate percentage
   *         image_url:
   *           type: string
   *           description: URL to product image
   *         is_active:
   *           type: boolean
   *           description: Whether the product is active
   *         weight:
   *           type: number
   *           format: decimal
   *           description: Product weight
   *         weight_unit:
   *           type: string
   *           description: Unit of weight measure (e.g., kg, g)
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(50),
      unique: true
    },
    barcode: {
      type: DataTypes.STRING(50),
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    shop_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'shops',
        key: 'id'
      }
    },
    unit_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'units',
        key: 'id'
      }
    },
    purchase_price: {
      type: DataTypes.DECIMAL(12, 2)
    },
    selling_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    discount_price: {
      type: DataTypes.DECIMAL(12, 2)
    },
    is_taxable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    tax_rate: {
      type: DataTypes.DECIMAL(5, 2)
    },
    image_url: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2)
    },
    weight_unit: {
      type: DataTypes.STRING(10)
    }
  }, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Define associations
  Product.associate = (models) => {
    // Product belongs to Category
    Product.belongsTo(models.Category, {
      foreignKey: 'category_id',
      as: 'category'
    });

    // Product belongs to Shop
    Product.belongsTo(models.Shop, {
      foreignKey: 'shop_id',
      as: 'shop'
    });

    // Product belongs to Unit (if defined)
    Product.belongsTo(models.Unit, {
      foreignKey: 'unit_id',
      as: 'unit'
    });

    // Product has one Inventory
    Product.hasOne(models.Inventory, {
      foreignKey: 'product_id',
      as: 'inventory'
    });

    // Product has many InventoryTransactions
    Product.hasMany(models.InventoryTransaction, {
      foreignKey: 'product_id',
      as: 'inventory_transactions'
    });

    // Product has many SaleItems
    Product.hasMany(models.SaleItem, {
      foreignKey: 'product_id',
      as: 'sale_items'
    });
  };

  return Product;
}; 