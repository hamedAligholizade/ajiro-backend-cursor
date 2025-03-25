const { DataTypes } = require('sequelize');

/**
 * Category model for product categorization
 * @param {import('sequelize').Sequelize} sequelize - Sequelize instance
 * @returns {import('sequelize').Model} - Category model
 */
module.exports = (sequelize) => {
  /**
   * @swagger
   * components:
   *   schemas:
   *     Category:
   *       type: object
   *       required:
   *         - name
   *       properties:
   *         id:
   *           type: string
   *           format: uuid
   *           description: The auto-generated category ID
   *         name:
   *           type: string
   *           description: Category name
   *         description:
   *           type: string
   *           description: Category description
   *         parent_id:
   *           type: string
   *           format: uuid
   *           nullable: true
   *           description: ID of parent category for hierarchical categorization
   *         image_url:
   *           type: string
   *           description: URL to category image
   *         is_active:
   *           type: boolean
   *           description: Whether the category is active
   *         created_at:
   *           type: string
   *           format: date-time
   *           description: Creation timestamp
   *         updated_at:
   *           type: string
   *           format: date-time
   *           description: Last update timestamp
   */
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    parent_id: {
      type: DataTypes.UUID,
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    image_url: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  // Self-referencing relationship for hierarchical categories
  Category.associate = (models) => {
    Category.hasMany(models.Category, { 
      foreignKey: 'parent_id', 
      as: 'subcategories' 
    });
    
    Category.belongsTo(models.Category, { 
      foreignKey: 'parent_id', 
      as: 'parent' 
    });
  };

  return Category;
}; 