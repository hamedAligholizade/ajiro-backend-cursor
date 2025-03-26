const express = require('express');
const { validate, schemas } = require('../middleware/validationMiddleware');
const salesController = require('../controllers/sales.controller');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: List all sales with filtering options
 *     tags: [Sales]
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
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [paid, partial, unpaid, refunded, cancelled]
 *         description: Filter by payment status
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [cash, card, mobile, credit, mixed]
 *         description: Filter by payment method
 *       - in: query
 *         name: min_amount
 *         schema:
 *           type: number
 *         description: Minimum total amount
 *       - in: query
 *         name: max_amount
 *         schema:
 *           type: number
 *         description: Maximum total amount
 *       - in: query
 *         name: invoice_number
 *         schema:
 *           type: string
 *         description: Search by invoice number
 *     responses:
 *       200:
 *         description: List of sales with pagination
 */
router.get('/', salesController.getAllSales);

/**
 * @swagger
 * /api/sales/statistics:
 *   get:
 *     summary: Get sales statistics for reporting
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Sales statistics and metrics
 */
router.get('/statistics', restrictTo('admin', 'manager'), salesController.getSalesStatistics);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get a sale by ID
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale details with all relationships
 *       404:
 *         description: Sale not found
 */
router.get('/:id', validate(schemas.idParam, 'params'), salesController.getSaleById);

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Create a new sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - payment_method
 *             properties:
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *                 description: Customer ID (optional for anonymous sales)
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - product_id
 *                     - quantity
 *                   properties:
 *                     product_id:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                     discount_percent:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *               payment_method:
 *                 type: string
 *                 enum: [cash, card, mobile, credit, mixed]
 *               notes:
 *                 type: string
 *               discount_amount:
 *                 type: number
 *                 minimum: 0
 *               loyalty_points_used:
 *                 type: integer
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Sale created successfully
 *       400:
 *         description: Invalid input or insufficient stock
 *       404:
 *         description: Product or customer not found
 */
router.post('/', validate(schemas.saleCreate), 
  restrictTo('admin', 'manager', 'cashier'), 
  salesController.createSale
);

/**
 * @swagger
 * /api/sales/{id}/payment-status:
 *   patch:
 *     summary: Update sale payment status
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_status
 *             properties:
 *               payment_status:
 *                 type: string
 *                 enum: [paid, partial, unpaid, refunded, cancelled]
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 *       400:
 *         description: Invalid status transition
 *       404:
 *         description: Sale not found
 */
router.patch('/:id/payment-status', 
  validate(schemas.idParam, 'params'),
  validate(schemas.paymentStatusUpdate),
  restrictTo('admin', 'manager', 'cashier'), 
  salesController.updatePaymentStatus
);

/**
 * @swagger
 * /api/sales/{id}/payments:
 *   post:
 *     summary: Process a payment for an existing sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - payment_method
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               payment_method:
 *                 type: string
 *                 enum: [cash, card, mobile, credit, mixed]
 *               reference_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment processed successfully
 *       400:
 *         description: Invalid payment amount or sale ineligible for payment
 *       404:
 *         description: Sale not found
 */
router.post('/:id/payments', 
  validate(schemas.idParam, 'params'),
  validate(schemas.paymentCreate),
  restrictTo('admin', 'manager', 'cashier'), 
  salesController.processPayment
);

/**
 * @swagger
 * /api/sales/{id}/refunds:
 *   post:
 *     summary: Process a refund for a sale
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               reason:
 *                 type: string
 *               refund_method:
 *                 type: string
 *                 enum: [cash, card, mobile, credit, mixed]
 *     responses:
 *       201:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid refund amount or sale ineligible for refund
 *       404:
 *         description: Sale not found
 */
router.post('/:id/refunds', 
  validate(schemas.idParam, 'params'),
  validate(schemas.refundCreate),
  restrictTo('admin', 'manager'), 
  salesController.processRefund
);

module.exports = router; 