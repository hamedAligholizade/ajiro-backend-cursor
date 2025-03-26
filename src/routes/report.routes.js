const express = require('express');
const reportController = require('../controllers/report.controller');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All report routes require authentication
router.use(authenticate);

// All reporting endpoints should be restricted to admin and manager roles
router.use(restrictTo('admin', 'manager'));

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get business dashboard with key performance metrics
 *     description: Returns overview of sales, inventory, and customer metrics for business dashboard
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - requires admin or manager role
 *       500:
 *         description: Server error
 */
router.get('/dashboard', reportController.getDashboardReport);

/**
 * @swagger
 * /api/reports/sales:
 *   get:
 *     summary: Get sales report
 *     description: Returns detailed sales data with various filtering options
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report (default - first day of current month)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report (default - current date)
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [hourly, daily, weekly, monthly, yearly]
 *         description: Grouping period for report (default - daily)
 *       - in: query
 *         name: include_taxes
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Include tax metrics in report (default - true)
 *       - in: query
 *         name: include_discounts
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Include discount metrics in report (default - true)
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [cash, card, mobile, credit, mixed]
 *         description: Filter by payment method
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *       - in: query
 *         name: product_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by product ID
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *     responses:
 *       200:
 *         description: Sales report retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - requires admin or manager role
 *       500:
 *         description: Server error
 */
router.get('/sales', reportController.getSalesReport);

/**
 * @swagger
 * /api/reports/inventory:
 *   get:
 *     summary: Get inventory report
 *     description: Returns detailed inventory status and movement data
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: low_stock_threshold
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Threshold to define low stock (default - 10)
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: include_zero_stock
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'true'
 *         description: Include products with zero stock
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [stock_quantity, available_quantity, reorder_level]
 *           default: stock_quantity
 *         description: Field to sort results by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Inventory report retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - requires admin or manager role
 *       500:
 *         description: Server error
 */
router.get('/inventory', reportController.getInventoryReport);

/**
 * @swagger
 * /api/reports/customers:
 *   get:
 *     summary: Get customer report
 *     description: Returns detailed customer activity and metrics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report (default - 1 year ago)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report (default - current date)
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [total_spend, transaction_count, average_spend, last_purchase]
 *           default: total_spend
 *         description: Field to sort results by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Maximum number of top customers to return
 *     responses:
 *       200:
 *         description: Customer report retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - requires admin or manager role
 *       500:
 *         description: Server error
 */
router.get('/customers', reportController.getCustomerReport);

/**
 * @swagger
 * /api/reports/products:
 *   get:
 *     summary: Get product performance report
 *     description: Returns metrics about product sales and performance
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report (default - 1 month ago)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report (default - current date)
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by category ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of products to return
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [quantity_sold, revenue, sale_count]
 *           default: quantity_sold
 *         description: Field to sort results by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Product report retrieved successfully
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Forbidden - requires admin or manager role
 *       500:
 *         description: Server error
 */
router.get('/products', reportController.getProductReport);

module.exports = router; 