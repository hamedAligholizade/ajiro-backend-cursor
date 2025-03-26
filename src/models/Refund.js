module.exports = (sequelize, DataTypes) => {
  const Refund = sequelize.define('Refund', {
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
    reason: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    refund_method: {
      type: DataTypes.ENUM('cash', 'card', 'mobile', 'credit', 'mixed'),
      allowNull: false
    },
    refund_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    reference_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'rejected'),
      allowNull: false,
      defaultValue: 'completed'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'refunds',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_refunds_sale_id',
        fields: ['sale_id']
      },
      {
        name: 'idx_refunds_refund_date',
        fields: ['refund_date']
      },
      {
        name: 'idx_refunds_status',
        fields: ['status']
      }
    ]
  });

  Refund.associate = function(models) {
    // Refund belongs to Sale
    Refund.belongsTo(models.Sale, {
      foreignKey: 'sale_id',
      as: 'sale'
    });

    // Refund belongs to User (staff who processed the refund)
    Refund.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  };

  return Refund;
}; 