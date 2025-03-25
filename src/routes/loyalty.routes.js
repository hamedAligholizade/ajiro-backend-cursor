const express = require('express');
const { validate, schemas } = require('../middleware/validationMiddleware');
const loyaltyController = require('../controllers/loyalty.controller');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/loyalty/rewards:
 *   get:
 *     summary: List all loyalty rewards
 *     tags: [Loyalty]
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
 *         description: Search by name or description
 *       - in: query
 *         name: reward_type
 *         schema:
 *           type: string
 *           enum: [discount, free_product, gift, service]
 *         description: Filter by reward type
 *       - in: query
 *         name: min_tier
 *         schema:
 *           type: string
 *           enum: [bronze, silver, gold, platinum]
 *         description: Filter by minimum tier required
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: available_now
 *         schema:
 *           type: boolean
 *         description: Filter for currently available rewards
 *     responses:
 *       200:
 *         description: List of rewards
 *       401:
 *         description: Unauthorized
 */
router.get('/rewards', loyaltyController.getAllRewards);

/**
 * @swagger
 * /api/loyalty/rewards/{id}:
 *   get:
 *     summary: Get reward details
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Reward ID
 *     responses:
 *       200:
 *         description: Reward details
 *       404:
 *         description: Reward not found
 */
router.get('/rewards/:id', validate(schemas.idParam, 'params'), loyaltyController.getRewardById);

/**
 * @swagger
 * /api/loyalty/rewards:
 *   post:
 *     summary: Create new reward
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoyaltyReward'
 *     responses:
 *       201:
 *         description: Reward created
 *       400:
 *         description: Invalid input
 */
router.post('/rewards', 
  restrictTo('admin', 'manager'), 
  validate(schemas.loyaltyRewardCreate), 
  loyaltyController.createReward
);

/**
 * @swagger
 * /api/loyalty/rewards/{id}:
 *   put:
 *     summary: Update reward
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Reward ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoyaltyReward'
 *     responses:
 *       200:
 *         description: Reward updated
 *       404:
 *         description: Reward not found
 */
router.put('/rewards/:id', 
  restrictTo('admin', 'manager'), 
  validate(schemas.idParam, 'params'), 
  loyaltyController.updateReward
);

/**
 * @swagger
 * /api/loyalty/rewards/{id}:
 *   delete:
 *     summary: Delete reward
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Reward ID
 *     responses:
 *       200:
 *         description: Reward deleted or deactivated
 *       404:
 *         description: Reward not found
 */
router.delete('/rewards/:id', 
  restrictTo('admin', 'manager'), 
  validate(schemas.idParam, 'params'), 
  loyaltyController.deleteReward
);

/**
 * @swagger
 * /api/loyalty/redemptions:
 *   get:
 *     summary: List all redemptions
 *     tags: [Loyalty]
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
 *         name: customer_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *       - in: query
 *         name: reward_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by reward ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: List of redemptions
 *       401:
 *         description: Unauthorized
 */
router.get('/redemptions', restrictTo('admin', 'manager', 'cashier'), loyaltyController.getAllRedemptions);

/**
 * @swagger
 * /api/loyalty/redemptions/{id}:
 *   get:
 *     summary: Get redemption details
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Redemption ID
 *     responses:
 *       200:
 *         description: Redemption details
 *       404:
 *         description: Redemption not found
 */
router.get('/redemptions/:id', 
  validate(schemas.idParam, 'params'), 
  loyaltyController.getRedemptionById
);

/**
 * @swagger
 * /api/loyalty/redemptions:
 *   post:
 *     summary: Create new redemption
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - reward_id
 *             properties:
 *               customer_id:
 *                 type: string
 *                 format: uuid
 *                 description: Customer ID
 *               reward_id:
 *                 type: string
 *                 format: uuid
 *                 description: Reward ID
 *               notes:
 *                 type: string
 *                 description: Notes about the redemption
 *     responses:
 *       201:
 *         description: Redemption created
 *       400:
 *         description: Invalid input
 */
router.post('/redemptions', 
  restrictTo('admin', 'manager', 'cashier'), 
  validate(schemas.loyaltyRedemptionCreate), 
  loyaltyController.createRedemption
);

/**
 * @swagger
 * /api/loyalty/redemptions/{id}/status:
 *   patch:
 *     summary: Update redemption status
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Redemption ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, cancelled]
 *                 description: New status
 *     responses:
 *       200:
 *         description: Redemption status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Redemption not found
 */
router.patch('/redemptions/:id/status', 
  restrictTo('admin', 'manager', 'cashier'), 
  validate(schemas.idParam, 'params'),
  loyaltyController.updateRedemptionStatus
);

/**
 * @swagger
 * /api/loyalty/transactions:
 *   get:
 *     summary: List loyalty transactions
 *     tags: [Loyalty]
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
 *         name: customer_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by customer ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [credit, debit]
 *         description: Filter by transaction type
 *       - in: query
 *         name: from_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date
 *       - in: query
 *         name: to_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date
 *     responses:
 *       200:
 *         description: List of transactions
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions', 
  restrictTo('admin', 'manager', 'cashier'), 
  loyaltyController.getLoyaltyTransactions
);

/**
 * @swagger
 * /api/loyalty/customer/{id}/summary:
 *   get:
 *     summary: Get customer loyalty summary
 *     tags: [Loyalty]
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
 *         description: Customer loyalty summary
 *       404:
 *         description: Customer not found
 */
router.get('/customer/:id/summary', 
  validate(schemas.idParam, 'params'), 
  loyaltyController.getCustomerLoyaltySummary
);

/**
 * @swagger
 * /api/loyalty/tiers:
 *   get:
 *     summary: Get loyalty program tier information
 *     tags: [Loyalty]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Loyalty program tiers
 */
router.get('/tiers', loyaltyController.getLoyaltyTiers);

module.exports = router; 