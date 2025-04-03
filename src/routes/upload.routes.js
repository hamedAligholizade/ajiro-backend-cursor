const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/authMiddleware');
const { AppError } = require('../middleware/errorHandler');

// Configure multer for in-memory storage (we'll handle file saving in the controllers)
const storage = multer.memoryStorage();

// File type validation
const fileFilter = (req, file, cb) => {
  // Only allow images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400, 'INVALID_FILE_TYPE'), false);
  }
};

// Set up multer with max file size and file type filter
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
  fileFilter: fileFilter
});

/**
 * @swagger
 * /api/upload/product-image:
 *   post:
 *     summary: Upload a product image
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 imageUrl:
 *                   type: string
 */
router.post('/product-image', authenticate, upload.single('image'), uploadController.uploadProductImage);

/**
 * @swagger
 * /api/upload/avatar:
 *   post:
 *     summary: Upload a user avatar
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 */
router.post('/avatar', authenticate, upload.single('image'), uploadController.uploadAvatar);

module.exports = router; 