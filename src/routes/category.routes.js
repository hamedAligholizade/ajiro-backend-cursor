const express = require('express');
const { validate, schemas } = require('../middleware/validationMiddleware');
const categoryController = require('../controllers/category.controller');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');
const { setShopContext, verifyShopAccess } = require('../middleware/shopAccess');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Set shop context for all routes
router.use(setShopContext);

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
 *         name: shop_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Shop ID
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
 *     parameters:
 *       - in: query
 *         name: shop_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Shop ID
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
 *       - in: query
 *         name: shop_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Shop ID
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
 *     summary: Create a new product category
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
 *               - shop_id
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               shop_id:
 *                 type: string
 *                 format: uuid
 *                 description: Shop ID
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not admin or manager
 */
router.post('/',
  restrictTo('admin', 'manager'),
  verifyShopAccess(),  // Verify user has access to the shop
  validate(schemas.categoryCreate),
  categoryController.createCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a product category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shop_id
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               description:
 *                 type: string
 *                 description: Category description
 *               shop_id:
 *                 type: string
 *                 format: uuid
 *                 description: Shop ID
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not admin or manager
 *       404:
 *         description: Category not found
 */
router.put('/:id',
  restrictTo('admin', 'manager'),
  verifyShopAccess(),  // Verify user has access to the shop
  validate(schemas.categoryUpdate),
  categoryController.updateCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: Delete a product category
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Category ID
 *       - in: query
 *         name: shop_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not admin or manager
 *       404:
 *         description: Category not found
 */
router.delete('/:id',
  restrictTo('admin', 'manager'),
  verifyShopAccess(),  // Verify user has access to the shop
  categoryController.deleteCategory
);

module.exports = router; 