module.exports = (sequelize, DataTypes) => {
  const Payment = sequelize.define('Payment', {
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
      onDelete: 'RESTRICT'
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    payment_method: {
      type: DataTypes.ENUM('cash', 'card', 'mobile', 'credit', 'mixed'),
      allowNull: false
    },
    payment_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reference_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'completed'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_payments_sale_id',
        fields: ['sale_id']
      },
      {
        name: 'idx_payments_payment_date',
        fields: ['payment_date']
      },
      {
        name: 'idx_payments_status',
        fields: ['status']
      }
    ]
  });

  Payment.associate = function(models) {
    // Payment belongs to Sale
    Payment.belongsTo(models.Sale, {
      foreignKey: 'sale_id',
      as: 'sale'
    });

    // Payment belongs to User (cashier who processed the payment)
    Payment.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Payment;
}; 