const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('../middleware/errorHandler');

// Ensure upload directories exist
const createDirectoryIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Base upload directory
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
createDirectoryIfNotExists(UPLOAD_DIR);

// Product images directory
const PRODUCT_IMAGES_DIR = path.join(UPLOAD_DIR, 'products');
createDirectoryIfNotExists(PRODUCT_IMAGES_DIR);

/**
 * Upload product image
 * @route POST /api/upload/product-image
 */
exports.uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file provided', 400, 'FILE_REQUIRED'));
    }

    // Generate a unique filename
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(PRODUCT_IMAGES_DIR, filename);
    
    // Create a write stream to save the file
    const writeStream = fs.createWriteStream(filePath);
    
    // Write the file buffer to the stream
    writeStream.write(req.file.buffer);
    writeStream.end();
    
    // Return success response with the image URL
    const imageUrl = `/uploads/products/${filename}`;
    
    res.status(200).json({
      success: true,
      imageUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload user avatar
 * @route POST /api/upload/avatar
 */
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file provided', 400, 'FILE_REQUIRED'));
    }

    // Create user avatars directory if it doesn't exist
    const avatarsDir = path.join(UPLOAD_DIR, 'avatars');
    createDirectoryIfNotExists(avatarsDir);
    
    // Generate a unique filename
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(avatarsDir, filename);
    
    // Create a write stream to save the file
    const writeStream = fs.createWriteStream(filePath);
    
    // Write the file buffer to the stream
    writeStream.write(req.file.buffer);
    writeStream.end();
    
    // Return success response with the avatar URL
    const avatarUrl = `/uploads/avatars/${filename}`;
    
    res.status(200).json({
      success: true,
      avatarUrl
    });
  } catch (error) {
    next(error);
  }
};