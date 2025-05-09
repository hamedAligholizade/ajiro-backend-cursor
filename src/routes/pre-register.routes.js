const express = require('express');
const { validate } = require('../middleware/validationMiddleware');
const preRegisterController = require('../controllers/pre-register.controller');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/pre-register:
 *   get:
 *     summary: Get all pre-registered users
 *     tags: [Pre-Registration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pre-registered users
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (admin only)
 */
router.get('/', authenticate, restrictTo('admin'), preRegisterController.getPreRegisters);

/**
 * @swagger
 * /api/pre-register:
 *   post:
 *     summary: Pre-register for Ajiro
 *     tags: [Pre-Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - phone
 *               - instagramId
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               phone:
 *                 type: string
 *                 description: Phone number
 *               instagramId:
 *                 type: string
 *                 description: Instagram username
 *     responses:
 *       201:
 *         description: Pre-registration successful
 *       400:
 *         description: Validation error or duplicate entry
 */
router.post('/', preRegisterController.preRegister);

module.exports = router; 