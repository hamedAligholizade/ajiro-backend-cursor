const { AppError } = require('../middleware/errorHandler');
const db = require('../models');
const { Op } = require('sequelize');

/**
 * Get all categories with pagination and filtering
 * @route GET /api/categories
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100; // Higher default limit for categories
    const offset = (page - 1) * limit;
    
    // Get shop_id from request (set by shopAccess middleware)
    const shopId = req.shop?.id || req.query.shop_id;
    
    if (!shopId) {
      return next(new AppError('Shop ID is required', 400, 'SHOP_ID_REQUIRED'));
    }

    // Build query with filtering options
    const query = {
      where: {
        shop_id: shopId
      },
      attributes: [
        'id', 'name', 'description', 'parent_id', 'image_url', 
        'is_active', 'created_at', 'updated_at', 'shop_id'
      ],
      limit,
      offset,
      order: [['name', 'ASC']]
    };

    // Add search filter if provided
    if (req.query.search) {
      query.where = {
        ...query.where,
        [Op.or]: [
          { name: { [Op.iLike]: `%${req.query.search}%` } },
          { description: { [Op.iLike]: `%${req.query.search}%` } }
        ]
      };
    }

    // Add active status filter if provided
    if (req.query.is_active !== undefined) {
      const isActive = req.query.is_active === 'true';
      query.where = {
        ...query.where,
        is_active: isActive
      };
    }

    // Add parent_id filter if provided
    if (req.query.parent_id) {
      query.where = {
        ...query.where,
        parent_id: req.query.parent_id
      };
    } else if (req.query.root === 'true') {
      // Only root categories (parent_id is null)
      query.where = {
        ...query.where,
        parent_id: null
      };
    }

    const { count, rows: categories } = await db.Category.findAndCountAll(query);

    res.status(200).json({
      success: true,
      data: {
        categories,
        pagination: {
          total: count,
          page,
          limit,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID with subcategories
 * @route GET /api/categories/:id
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    // Get shop_id from request (set by shopAccess middleware)
    const shopId = req.shop?.id || req.query.shop_id;
    
    if (!shopId) {
      return next(new AppError('Shop ID is required', 400, 'SHOP_ID_REQUIRED'));
    }
    
    const category = await db.Category.findOne({
      where: {
        id: req.params.id,
        shop_id: shopId
      },
      include: [
        {
          model: db.Category,
          as: 'subcategories',
          where: { shop_id: shopId },
          attributes: ['id', 'name', 'description', 'is_active', 'image_url', 'shop_id'],
          required: false
        }
      ]
    });

    if (!category) {
      return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
    }

    // Get product count for this category
    const productCount = await db.Product.count({
      where: { 
        category_id: req.params.id,
        shop_id: shopId
      }
    });

    // Augment response with product count
    const response = category.toJSON();
    response.product_count = productCount;

    res.status(200).json({
      success: true,
      data: {
        category: response
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category hierarchy (tree structure)
 * @route GET /api/categories/hierarchy
 */
exports.getCategoryHierarchy = async (req, res, next) => {
  try {
    // Get all categories
    const categories = await db.Category.findAll({
      attributes: ['id', 'name', 'description', 'parent_id', 'is_active', 'image_url'],
      order: [['name', 'ASC']]
    });

    // Convert flat list to hierarchical structure
    const categoriesMap = {};
    categories.forEach(category => {
      categoriesMap[category.id] = {
        ...category.toJSON(),
        subcategories: []
      };
    });

    const rootCategories = [];
    categories.forEach(category => {
      if (category.parent_id) {
        if (categoriesMap[category.parent_id]) {
          categoriesMap[category.parent_id].subcategories.push(categoriesMap[category.id]);
        }
      } else {
        rootCategories.push(categoriesMap[category.id]);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        categories: rootCategories
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new category
 * @route POST /api/categories
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, parent_id, image_url, is_active } = req.body;
    
    // Get shop_id from request (set by shopAccess middleware)
    const shopId = req.shop?.id || req.body.shop_id;
    
    if (!shopId) {
      return next(new AppError('Shop ID is required', 400, 'SHOP_ID_REQUIRED'));
    }

    // Check if parent exists if provided and belongs to the same shop
    if (parent_id) {
      const parentCategory = await db.Category.findOne({
        where: {
          id: parent_id,
          shop_id: shopId
        }
      });
      
      if (!parentCategory) {
        return next(new AppError('Parent category not found or does not belong to this shop', 404, 'PARENT_CATEGORY_NOT_FOUND'));
      }
    }

    // Check if name already exists at same level for this shop
    const existingCategory = await db.Category.findOne({
      where: {
        name,
        parent_id: parent_id || null,
        shop_id: shopId
      }
    });

    if (existingCategory) {
      return next(new AppError('A category with this name already exists at the same level', 400, 'DUPLICATE_CATEGORY'));
    }

    // Create category
    const category = await db.Category.create({
      name,
      description,
      parent_id,
      shop_id: shopId,
      image_url,
      is_active: is_active !== undefined ? is_active : true
    });

    res.status(201).json({
      success: true,
      data: {
        category
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * @route PUT /api/categories/:id
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { name, description, parent_id, image_url, is_active } = req.body;
    const categoryId = req.params.id;

    // Check if category exists
    const category = await db.Category.findByPk(categoryId);
    if (!category) {
      return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
    }

    // Prevent circular reference (parent can't be itself or any of its descendants)
    if (parent_id && parent_id !== category.parent_id) {
      if (parent_id === categoryId) {
        return next(new AppError('Category cannot be its own parent', 400, 'INVALID_PARENT'));
      }

      // Check if new parent is a descendant of this category (would create a loop)
      const isDescendant = await isParentDescendant(categoryId, parent_id);
      if (isDescendant) {
        return next(new AppError('Cannot set a descendant as parent (would create a circular reference)', 400, 'INVALID_PARENT'));
      }

      // Check if parent exists
      const parentCategory = await db.Category.findByPk(parent_id);
      if (!parentCategory) {
        return next(new AppError('Parent category not found', 404, 'PARENT_CATEGORY_NOT_FOUND'));
      }
    }

    // Check if name is changed and already exists at same level
    if (name && name !== category.name) {
      const existingCategory = await db.Category.findOne({
        where: {
          name,
          parent_id: parent_id || category.parent_id || null,
          id: { [Op.ne]: categoryId }
        }
      });

      if (existingCategory) {
        return next(new AppError('A category with this name already exists at the same level', 400, 'DUPLICATE_CATEGORY'));
      }
    }

    // Update category
    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      parent_id: parent_id !== undefined ? parent_id : category.parent_id,
      image_url: image_url !== undefined ? image_url : category.image_url,
      is_active: is_active !== undefined ? is_active : category.is_active
    });

    // Get updated category with subcategories
    const updatedCategory = await db.Category.findByPk(categoryId, {
      include: [
        {
          model: db.Category,
          as: 'subcategories',
          attributes: ['id', 'name', 'description', 'is_active']
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        category: updatedCategory
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * @route DELETE /api/categories/:id
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const categoryId = req.params.id;

    // Check if category exists
    const category = await db.Category.findByPk(categoryId);
    if (!category) {
      return next(new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND'));
    }

    // Check if category has subcategories
    const subcategoriesCount = await db.Category.count({
      where: { parent_id: categoryId }
    });

    if (subcategoriesCount > 0) {
      return next(new AppError('Cannot delete category with subcategories', 400, 'HAS_SUBCATEGORIES'));
    }

    // Check if category has products
    const productsCount = await db.Product.count({
      where: { category_id: categoryId }
    });

    if (productsCount > 0) {
      return next(new AppError('Cannot delete category with products', 400, 'HAS_PRODUCTS'));
    }

    // Delete category
    await category.destroy();

    res.status(200).json({
      success: true,
      message: 'Category successfully deleted'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to check if a parent is a descendant of a category
 * (used to prevent circular references)
 */
async function isParentDescendant(categoryId, potentialParentId) {
  // If they're the same, it's a circular reference
  if (categoryId === potentialParentId) {
    return true;
  }

  // Get the potential parent
  const potentialParent = await db.Category.findByPk(potentialParentId);
  if (!potentialParent || !potentialParent.parent_id) {
    return false;
  }

  // If the potential parent's parent is the category, it's a circular reference
  if (potentialParent.parent_id === categoryId) {
    return true;
  }

  // Recursively check the parent's parent
  return await isParentDescendant(categoryId, potentialParent.parent_id);
} 