const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Initialize Sequelize with PostgreSQL connection
const sequelize = new Sequelize(
  config.database.url || 
  `postgres://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`,
  {
    dialect: config.database.dialect,
    logging: config.database.logging ? msg => logger.debug(msg) : false,
    define: {
      underscored: true, // Use snake_case for fields
      timestamps: true, // Add createdAt and updatedAt timestamps
      paranoid: true, // Soft deletes (adds deletedAt timestamp)
    }
  }
);

// Test the connection
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
  }
})();

const db = {};

// Import all models dynamically from this directory
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      (file.slice(-9) === '.model.js' || file.slice(-3) === '.js')
    );
  })
  .forEach(file => {
    // Skip index.js itself
    if (file === 'index.js') return;
    
    try {
      const model = require(path.join(__dirname, file))(sequelize, DataTypes);
      db[model.name] = model;
    } catch (error) {
      logger.error(`Error loading model file ${file}:`, error);
    }
  });

// Import models
db.User = require('./user.model')(sequelize, DataTypes);
db.Customer = require('./customer.model')(sequelize, DataTypes);
db.Category = require('./category.model')(sequelize, DataTypes);
db.Product = require('./product.model')(sequelize, DataTypes);
db.Inventory = require('./inventory.model')(sequelize, DataTypes);
db.LoyaltyProgram = require('./loyaltyProgram.model')(sequelize, DataTypes);
db.LoyaltyTransaction = require('./loyaltyTransaction.model')(sequelize, DataTypes);
db.Sale = require('./sale.model')(sequelize, DataTypes);
db.SaleItem = require('./saleItem.model')(sequelize, DataTypes);
db.Order = require('./order.model')(sequelize, DataTypes);
db.OrderItem = require('./orderItem.model')(sequelize, DataTypes);
db.OrderStatusHistory = require('./orderStatusHistory.model')(sequelize, DataTypes);
db.FeedbackForm = require('./feedback-form.model')(sequelize, DataTypes);
db.FeedbackQuestion = require('./feedback-question.model')(sequelize, DataTypes);
db.FeedbackResponse = require('./feedback-response.model')(sequelize, DataTypes);
db.FeedbackResponseDetail = require('./feedback-response-detail.model')(sequelize, DataTypes);
db.Shop = require('./shop.model')(sequelize, DataTypes);
db.UserShop = require('./userShop.model')(sequelize, DataTypes);
db.Unit = require('./unit.model')(sequelize, DataTypes);

// Add the sequelize instance and Sequelize class to db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Call associate function on each model (if it exists)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
    } catch (error) {
      logger.error(`Error associating model ${modelName}:`, error);
    }
  }
});

module.exports = db; 