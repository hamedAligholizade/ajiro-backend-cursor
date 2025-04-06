const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shop.controller');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/shop/all:
 *   get:
 *     summary: Get all shops the current user has access to
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of accessible shops
 *       401:
 *         description: Unauthorized
 */
router.get('/all', shopController.getUserShops);

/**
 * @swagger
 * /api/shop:
 *   get:
 *     summary: Get current user's shop details
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shop details
 *       400:
 *         description: No shop associated with user
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 */
router.get('/', shopController.getShopDetails);

/**
 * @swagger
 * /api/shop:
 *   put:
 *     summary: Update shop details
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Shop name
 *               description:
 *                 type: string
 *                 description: Shop description
 *               business_type:
 *                 type: string
 *                 description: Type of business
 *               address:
 *                 type: string
 *                 description: Shop address
 *               phone:
 *                 type: string
 *                 description: Shop phone number
 *               tax_enabled:
 *                 type: boolean
 *                 description: Whether tax is enabled
 *               tax_rate:
 *                 type: number
 *                 description: Tax rate percentage
 *               currency:
 *                 type: string
 *                 description: Currency used in the shop
 *     responses:
 *       200:
 *         description: Shop updated successfully
 *       400:
 *         description: No shop associated with user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not shop owner or admin
 *       404:
 *         description: Shop not found
 */
router.put('/',
  restrictTo('admin', 'manager'),
  validate(schemas.shopUpdate),
  shopController.updateShop
);

/**
 * @swagger
 * /api/shop/tax:
 *   put:
 *     summary: Update shop tax settings
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tax_enabled:
 *                 type: boolean
 *                 description: Whether tax is enabled
 *               tax_rate:
 *                 type: number
 *                 description: Tax rate percentage
 *     responses:
 *       200:
 *         description: Tax settings updated successfully
 *       400:
 *         description: No shop associated with user or invalid tax rate
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not shop owner or admin
 *       404:
 *         description: Shop not found
 */
router.put('/tax',
  restrictTo('admin', 'manager'),
  validate(schemas.taxSettings),
  shopController.updateTaxSettings
);

/**
 * @swagger
 * /api/shop/users:
 *   get:
 *     summary: Get all users associated with the shop
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shop users
 *       400:
 *         description: No shop associated with user
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Shop not found
 */
router.get('/users', shopController.getShopUsers);

/**
 * @swagger
 * /api/shop/users:
 *   post:
 *     summary: Add a user to the shop
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email of the user to add
 *               role:
 *                 type: string
 *                 enum: [manager, cashier, inventory, marketing]
 *                 description: Role to assign to the user
 *     responses:
 *       201:
 *         description: User added successfully
 *       400:
 *         description: Invalid input or user already in shop
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not shop owner or admin
 *       404:
 *         description: Shop not found
 */
router.post('/users',
  restrictTo('admin', 'manager'),
  validate(schemas.shopUserAdd),
  shopController.addUserToShop
);

/**
 * @swagger
 * /api/shop/users/{userId}:
 *   delete:
 *     summary: Remove a user from the shop
 *     tags: [Shop]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID of the user to remove
 *     responses:
 *       200:
 *         description: User removed successfully
 *       400:
 *         description: No shop associated with user
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not shop owner or admin
 *       404:
 *         description: User or shop not found
 */
router.delete('/users/:userId',
  restrictTo('admin', 'manager'),
  validate(schemas.uuidParam, 'params'),
  shopController.removeUserFromShop
);

module.exports = router; 