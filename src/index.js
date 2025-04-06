const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

// Import local modules
const config = require('./config');
const logger = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate: authenticateJWT } = require('./middleware/authMiddleware');
const { staticWithCors } = require('./middleware/staticMiddleware');
const ensureShopId = require('./middleware/ensureShopId');
const db = require('./models');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const customerRoutes = require('./routes/customer.routes');
const categoryRoutes = require('./routes/category.routes');
const productRoutes = require('./routes/product.routes');
const loyaltyRoutes = require('./routes/loyalty.routes');
const salesRoutes = require('./routes/sales.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const reportRoutes = require('./routes/report.routes');
const feedbackRoutes = require('./routes/feedback.routes');
const orderRoutes = require('./routes/order.routes');
const shopRoutes = require('./routes/shop.routes');
const unitRoutes = require('./routes/unit.routes');
const uploadRoutes = require('./routes/upload.routes');

// Initialize express app
const app = express();

// Set up middleware
app.use(cors(config.cors));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Serve static files from the uploads directory with CORS headers
app.use('/uploads', ...staticWithCors('/uploads', path.join(__dirname, '../uploads')));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});
app.use('/api', limiter);

// Swagger documentation
const swaggerSpec = swaggerJsdoc(config.swagger);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Apply ensureShopId middleware to routes that need shop_id
app.use('/api/customers', authenticateJWT, ensureShopId, customerRoutes);
app.use('/api/categories', authenticateJWT, ensureShopId, categoryRoutes);
app.use('/api/products', authenticateJWT, ensureShopId, productRoutes);
app.use('/api/loyalty', authenticateJWT, ensureShopId, loyaltyRoutes);
app.use('/api/sales', authenticateJWT, ensureShopId, salesRoutes);
app.use('/api/inventory', authenticateJWT, ensureShopId, inventoryRoutes);
app.use('/api/reports', authenticateJWT, ensureShopId, reportRoutes);
app.use('/api/feedback', authenticateJWT, ensureShopId, feedbackRoutes);
app.use('/api/orders', authenticateJWT, ensureShopId, orderRoutes);
app.use('/api/shops', authenticateJWT, shopRoutes);
app.use('/api/units', authenticateJWT, ensureShopId, unitRoutes);
app.use('/api/uploads', authenticateJWT, ensureShopId, uploadRoutes);
app.use('/api/shop', authenticateJWT, shopRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const PORT = config.server.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

module.exports = app; 