module.exports = (sequelize, DataTypes) => {
  const Sale = sequelize.define('Sale', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    invoice_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    customer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Customers',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    sale_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    tax_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'card', 'mobile', 'credit', 'mixed'),
      allowNull: false
    },
    payment_status: {
      type: DataTypes.ENUM('paid', 'partial', 'unpaid', 'refunded', 'cancelled'),
      allowNull: false,
      defaultValue: 'unpaid'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    loyalty_points_earned: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    loyalty_points_used: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    tableName: 'sales',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_sales_invoice_number',
        fields: ['invoice_number'],
        unique: true
      },
      {
        name: 'idx_sales_customer_id',
        fields: ['customer_id']
      },
      {
        name: 'idx_sales_user_id',
        fields: ['user_id']
      },
      {
        name: 'idx_sales_sale_date',
        fields: ['sale_date']
      },
      {
        name: 'idx_sales_payment_status',
        fields: ['payment_status']
      }
    ]
  });

  Sale.associate = function(models) {
    // Sale belongs to Customer (optional, for guest sales)
    Sale.belongsTo(models.Customer, {
      foreignKey: 'customer_id',
      as: 'customer'
    });

    // Sale belongs to User (cashier who created the sale)
    Sale.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Sale has many SaleItems
    Sale.hasMany(models.SaleItem, {
      foreignKey: 'sale_id',
      as: 'items',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Sale has many Payments
    Sale.hasMany(models.Payment, {
      foreignKey: 'sale_id',
      as: 'payments',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Sale has many Refunds
    Sale.hasMany(models.Refund, {
      foreignKey: 'sale_id',
      as: 'refunds',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Sale has many LoyaltyTransactions
    Sale.hasMany(models.LoyaltyTransaction, {
      foreignKey: 'sale_id',
      as: 'loyalty_transactions',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return Sale;
}; 