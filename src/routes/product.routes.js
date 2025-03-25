const express = require('express');
const { validate, schemas } = require('../middleware/validationMiddleware');
const productController = require('../controllers/product.controller');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: List all products
 *     tags: [Products]
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
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, sku, barcode, or description
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: in_stock
 *         schema:
 *           type: boolean
 *         description: Filter by stock availability
 *     responses:
 *       200:
 *         description: A list of products
 */
router.get('/', productController.getAllProducts);

/**
 * @swagger
 * /api/products/low-stock:
 *   get:
 *     summary: List products with low stock
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products with stock below reorder level
 */
router.get('/low-stock', restrictTo('admin', 'manager', 'inventory'), productController.getLowStockProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product details by ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get('/:id', validate(schemas.idParam, 'params'), productController.getProductById);

/**
 * @swagger
 * /api/products/{id}/inventory-history:
 *   get:
 *     summary: Get product inventory history
 *     tags: [Products, Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Product inventory history
 *       404:
 *         description: Product not found
 */
router.get('/:id/inventory-history', 
  validate(schemas.idParam, 'params'),
  restrictTo('admin', 'manager', 'inventory'),
  productController.getInventoryHistory
);

/**
 * @swagger
 * /api/products/{id}/sales-stats:
 *   get:
 *     summary: Get product sales statistics
 *     tags: [Products, Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to include in statistics
 *     responses:
 *       200:
 *         description: Product sales statistics
 *       404:
 *         description: Product not found
 */
router.get('/:id/sales-stats', 
  validate(schemas.idParam, 'params'),
  restrictTo('admin', 'manager'),
  productController.getProductSalesStats
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', 
  restrictTo('admin', 'manager', 'inventory'),
  validate(schemas.productCreate),
  productController.createProduct
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       404:
 *         description: Product not found
 */
router.put('/:id', 
  validate(schemas.idParam, 'params'),
  restrictTo('admin', 'manager', 'inventory'),
  productController.updateProduct
);

/**
 * @swagger
 * /api/products/{id}/inventory:
 *   patch:
 *     summary: Update product inventory
 *     tags: [Products, Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stock_quantity:
 *                 type: integer
 *                 description: Total stock quantity
 *               available_quantity:
 *                 type: integer
 *                 description: Available stock quantity
 *               reserved_quantity:
 *                 type: integer
 *                 description: Reserved stock quantity
 *               reorder_level:
 *                 type: integer
 *                 description: Reorder level threshold
 *               reorder_quantity:
 *                 type: integer
 *                 description: Quantity to reorder when threshold is reached
 *               location:
 *                 type: string
 *                 description: Storage location
 *               adjustment_reason:
 *                 type: string
 *                 description: Reason for inventory adjustment
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *       404:
 *         description: Product not found
 */
router.patch('/:id/inventory', 
  validate(schemas.idParam, 'params'),
  restrictTo('admin', 'manager', 'inventory'),
  productController.updateInventory
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete a product
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product deleted or deactivated successfully
 *       404:
 *         description: Product not found
 */
router.delete('/:id', 
  validate(schemas.idParam, 'params'),
  restrictTo('admin', 'manager'),
  productController.deleteProduct
);

module.exports = router; 