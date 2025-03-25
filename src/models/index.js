const { Sequelize } = require('sequelize');
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
      file.slice(-9) === '.model.js'
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  });

// Add the sequelize instance and Sequelize class to db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Call associate function on each model (if it exists)
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db; 