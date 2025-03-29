const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/inventory.controller');
const { authenticateJWT, authorizeRoles } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const schemas = require('../validation/inventory.schema');

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Inventory management
 */

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
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
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: low_stock
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Filter to show only low stock items
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for product name, SKU, or barcode
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [stock_quantity, available_quantity, reserved_quantity, updated_at]
 *           default: stock_quantity
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of inventory items
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user not authorized
 *       500:
 *         description: Server error
 */
router.get('/',
  authenticateJWT,
  authorizeRoles(['admin', 'manager', 'inventory']),
  InventoryController.getAllInventory
);

/**
 * @swagger
 * /api/inventory/low-stock:
 *   get:
 *     summary: Get low stock products
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Threshold to define low stock
 *     responses:
 *       200:
 *         description: List of low stock products
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user not authorized
 *       500:
 *         description: Server error
 */
router.get('/low-stock',
  authenticateJWT,
  authorizeRoles(['admin', 'manager', 'inventory']),
  InventoryController.getLowStockProducts
);

/**
 * @swagger
 * /api/inventory/summary:
 *   get:
 *     summary: Get inventory summary statistics
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory summary statistics
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user not authorized
 *       500:
 *         description: Server error
 */
router.get('/summary',
  authenticateJWT,
  authorizeRoles(['admin', 'manager', 'inventory']),
  InventoryController.getInventorySummary
);

/**
 * @swagger
 * /api/inventory/product/{id}:
 *   get:
 *     summary: Get inventory for a specific product
 *     tags: [Inventory]
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
 *         description: Product inventory details
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user not authorized
 *       404:
 *         description: Inventory not found for this product
 *       500:
 *         description: Server error
 */
router.get('/product/:id',
  authenticateJWT,
  authorizeRoles(['admin', 'manager', 'inventory']),
  validate(schemas.idParam, 'params'),
  InventoryController.getInventoryByProductId
);

/**
 * @swagger
 * /api/inventory/product/{id}:
 *   patch:
 *     summary: Update inventory for a specific product
 *     tags: [Inventory]
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
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user not authorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.patch('/product/:id',
  authenticateJWT,
  authorizeRoles(['admin', 'manager', 'inventory']),
  validate(schemas.idParam, 'params'),
  InventoryController.updateInventory
);

/**
 * @swagger
 * /api/inventory/product/{id}/history:
 *   get:
 *     summary: Get inventory transaction history for a product
 *     tags: [Inventory]
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
 *         description: Product inventory transaction history
 *       401:
 *         description: Unauthorized - user not authenticated
 *       403:
 *         description: Forbidden - user not authorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/product/:id/history',
  authenticateJWT,
  authorizeRoles(['admin', 'manager', 'inventory']),
  validate(schemas.idParam, 'params'),
  InventoryController.getInventoryHistory
);

module.exports = router; 