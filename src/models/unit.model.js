'use strict';

module.exports = (sequelize, DataTypes) => {
  const Unit = sequelize.define('Unit', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    shop_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'shops',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Name is required'
        }
      }
    },
    abbreviation: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Abbreviation is required'
        }
      }
    },
    is_default: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    conversion_factor: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 1.0000,
      validate: {
        min: {
          args: [0.0001],
          msg: 'Conversion factor must be greater than 0'
        }
      }
    }
  }, {
    tableName: 'units',
    timestamps: true,
    paranoid: true, // This enables soft deletes
    underscored: true, // Use snake_case for fields
    indexes: [
      {
        unique: true,
        fields: ['shop_id', 'name'],
        where: {
          deleted_at: null
        }
      }
    ]
  });

  Unit.associate = function(models) {
    // Unit belongs to a Shop
    Unit.belongsTo(models.Shop, {
      foreignKey: 'shop_id',
      as: 'shop'
    });

    // Unit can have many Products
    Unit.hasMany(models.Product, {
      foreignKey: 'unit_id',
      as: 'products'
    });
  };

  return Unit;
}; 