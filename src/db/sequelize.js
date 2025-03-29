const { Sequelize } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');

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

module.exports = sequelize; 