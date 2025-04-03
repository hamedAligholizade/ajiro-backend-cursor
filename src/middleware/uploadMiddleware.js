const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('./errorHandler');

// Ensure upload directories exist
const createDirectoryIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Create uploads directory
const uploadsDir = path.join(__dirname, '../../uploads');
const productImagesDir = path.join(uploadsDir, 'products');

createDirectoryIfNotExists(uploadsDir);
createDirectoryIfNotExists(productImagesDir);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = uploadsDir;
    
    // Determine upload directory based on file type
    if (req.path.includes('product-image')) {
      uploadPath = productImagesDir;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// File filter for validating uploads
const fileFilter = (req, file, cb) => {
  // Define allowed mime types by upload type
  const allowedTypes = {
    'image': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    'document': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };
  
  // Determine allowed types based on upload path
  let fileTypeCategory = 'image';
  if (req.path.includes('document')) {
    fileTypeCategory = 'document';
  }
  
  // Check if file type is allowed
  if (allowedTypes[fileTypeCategory].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Invalid file type. Allowed types: ${allowedTypes[fileTypeCategory].join(', ')}`, 400));
  }
};

// Configure multer upload limits
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
  files: 1
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits
});

// Middleware for single image upload
const uploadProductImage = upload.single('image');

// Middleware to handle multer errors
const handleUploadErrors = (req, res, next) => {
  return (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError('File size exceeds the limit (5MB)', 400));
      }
      return next(new AppError(`Upload error: ${err.message}`, 400));
    } else if (err) {
      return next(err);
    }
    next();
  };
};

module.exports = {
  uploadProductImage,
  handleUploadErrors
}; 