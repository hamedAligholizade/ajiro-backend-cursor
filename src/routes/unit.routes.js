const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unit.controller');
const { authenticate, restrictTo } = require('../middleware/authMiddleware');
const { validate, schemas } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/units:
 *   get:
 *     summary: Get all measurement units for current shop
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of measurement units
 *       401:
 *         description: Unauthorized
 */
router.get('/', unitController.getUnits);

/**
 * @swagger
 * /api/units:
 *   post:
 *     summary: Create a new measurement unit
 *     tags: [Units]
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
 *               - abbreviation
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unit name (e.g., Kilogram, Gram)
 *               abbreviation:
 *                 type: string
 *                 description: Unit abbreviation (e.g., kg, g)
 *               is_default:
 *                 type: boolean
 *                 description: Whether this is the default unit
 *                 default: false
 *               conversion_factor:
 *                 type: number
 *                 description: Conversion factor to base unit
 *     responses:
 *       201:
 *         description: Unit created successfully
 *       400:
 *         description: Invalid request data or unit with same name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not admin or manager
 */
router.post('/',
  restrictTo('admin', 'manager'),
  validate(schemas.unitCreate),
  unitController.createUnit
);

/**
 * @swagger
 * /api/units/{id}:
 *   put:
 *     summary: Update a measurement unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unit ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Unit name
 *               abbreviation:
 *                 type: string
 *                 description: Unit abbreviation
 *               is_default:
 *                 type: boolean
 *                 description: Whether this is the default unit
 *               conversion_factor:
 *                 type: number
 *                 description: Conversion factor to base unit
 *     responses:
 *       200:
 *         description: Unit updated successfully
 *       400:
 *         description: Invalid request data or unit with same name already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not admin or manager
 *       404:
 *         description: Unit not found
 */
router.put('/:id',
  restrictTo('admin', 'manager'),
  validate(schemas.unitUpdate),
  unitController.updateUnit
);

/**
 * @swagger
 * /api/units/{id}:
 *   delete:
 *     summary: Delete a measurement unit
 *     tags: [Units]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unit ID
 *     responses:
 *       200:
 *         description: Unit deleted successfully
 *       400:
 *         description: Cannot delete unit in use by products
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - not admin or manager
 *       404:
 *         description: Unit not found
 */
router.delete('/:id',
  restrictTo('admin', 'manager'),
  unitController.deleteUnit
);

module.exports = router; 