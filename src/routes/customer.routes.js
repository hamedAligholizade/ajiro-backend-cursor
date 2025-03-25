const express = require('express');
const { validate, schemas } = require('../middleware/validationMiddleware');
const customerController = require('../controllers/customer.controller');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: List all customers
 *     tags: [Customers]
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
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: loyalty_tier
 *         schema:
 *           type: string
 *           enum: [bronze, silver, gold, platinum]
 *         description: Filter by loyalty tier
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *     responses:
 *       200:
 *         description: List of customers
 *       401:
 *         description: Unauthorized
 */
router.get('/', customerController.getAllCustomers);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer details
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer details
 *       404:
 *         description: Customer not found
 */
router.get('/:id', validate(schemas.idParam, 'params'), customerController.getCustomerById);

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create new customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       201:
 *         description: Customer created
 *       400:
 *         description: Invalid input
 */
router.post('/', validate(schemas.customerCreate), customerController.createCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       200:
 *         description: Customer updated
 *       404:
 *         description: Customer not found
 */
router.put('/:id', validate(schemas.idParam, 'params'), customerController.updateCustomer);

/**
 * @swagger
 * /api/customers/{id}/activate:
 *   patch:
 *     summary: Activate customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer activated
 *       404:
 *         description: Customer not found
 */
router.patch('/:id/activate', validate(schemas.idParam, 'params'), customerController.activateCustomer);

/**
 * @swagger
 * /api/customers/{id}/deactivate:
 *   patch:
 *     summary: Deactivate customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deactivated
 *       404:
 *         description: Customer not found
 */
router.patch('/:id/deactivate', validate(schemas.idParam, 'params'), customerController.deactivateCustomer);

/**
 * @swagger
 * /api/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted or deactivated
 *       404:
 *         description: Customer not found
 */
router.delete('/:id', validate(schemas.idParam, 'params'), customerController.deleteCustomer);

/**
 * @swagger
 * /api/customers/{id}/loyalty:
 *   patch:
 *     summary: Update customer loyalty points
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - points
 *             properties:
 *               points:
 *                 type: integer
 *                 description: Points to add (positive) or deduct (negative)
 *               description:
 *                 type: string
 *                 description: Reason for point adjustment
 *     responses:
 *       200:
 *         description: Loyalty points updated
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Customer not found
 */
router.patch('/:id/loyalty', 
  validate(schemas.idParam, 'params'), 
  restrictTo('admin', 'manager', 'cashier'), 
  customerController.updateLoyaltyPoints
);

/**
 * @swagger
 * /api/customers/{id}/purchases:
 *   get:
 *     summary: Get customer purchase history
 *     tags: [Customers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Customer ID
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
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Customer purchase history
 *       404:
 *         description: Customer not found
 */
router.get('/:id/purchases', validate(schemas.idParam, 'params'), customerController.getCustomerPurchases);

module.exports = router; 