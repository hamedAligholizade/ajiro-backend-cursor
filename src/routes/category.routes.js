const express = require('express');
const { validate, schemas } = require('../middleware/validationMiddleware');
const categoryController = require('../controllers/category.controller');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: List all categories
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or description
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by parent category ID
 *       - in: query
 *         name: root
 *         schema:
 *           type: boolean
 *         description: When true, only returns root categories (parent_id is null)
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: A list of categories
 */
router.get('/', categoryController.getAllCategories);

/**
 * @swagger
 * /api/categories/hierarchy:
 *   get:
 *     summary: Get category hierarchy (tree structure)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hierarchical category structure
 */
router.get('/hierarchy', categoryController.getCategoryHierarchy);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get category details by ID
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details with subcategories
 *       404:
 *         description: Category not found
 */
router.get('/:id', validate(schemas.idParam, 'params'), categoryController.getCategoryById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               parent_id:
 *                 type: string
 *                 format: uuid
 *                 description: Parent category ID (optional)
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: URL to category image
 *               is_active:
 *                 type: boolean
 *                 description: Whether the category is active
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Validation error or duplicate category
 *       404:
 *         description: Parent category not found
 */
router.post('/', 
  restrictTo('admin', 'manager'),
  validate(schemas.categoryCreate),
  categoryController.createCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               parent_id:
 *                 type: string
 *                 format: uuid
 *                 description: Parent category ID
 *               image_url:
 *                 type: string
 *                 format: uri
 *                 description: URL to category image
 *               is_active:
 *                 type: boolean
 *                 description: Whether the category is active
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error, duplicate category, or circular reference
 *       404:
 *         description: Category or parent category not found
 */
router.put('/:id', 
  validate(schemas.idParam, 'params'),
  restrictTo('admin', 'manager'),
  validate(schemas.categoryUpdate),
  categoryController.updateCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       400:
 *         description: Cannot delete category with subcategories or products
 *       404:
 *         description: Category not found
 */
router.delete('/:id', 
  validate(schemas.idParam, 'params'),
  restrictTo('admin', 'manager'),
  categoryController.deleteCategory
);

module.exports = router; 