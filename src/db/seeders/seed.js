const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('../../config');
const logger = require('../../utils/logger');

// Create sequelize instance
const sequelize = new Sequelize(
  config.database.url || 
  `postgres://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`,
  {
    dialect: config.database.dialect,
    logging: msg => logger.debug(msg)
  }
);

// Create seeds table if it doesn't exist
async function initSeedsTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS seeds (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info('Seeds table initialized');
  } catch (error) {
    logger.error('Seeds table initialization failed:', error);
    throw error;
  }
}

// Get list of already executed seeds
async function getExecutedSeeds() {
  try {
    const [results] = await sequelize.query('SELECT name FROM seeds ORDER BY id ASC;');
    return results.map(result => result.name);
  } catch (error) {
    logger.error('Failed to get executed seeds:', error);
    throw error;
  }
}

// Get list of all seed files
function getSeedFiles() {
  const seedDir = path.join(__dirname);
  return fs.readdirSync(seedDir)
    .filter(file => {
      return file.endsWith('.js') && 
             file !== path.basename(__filename) &&
             file !== 'seed-template.js';
    })
    .sort(); // Ensure seeds are executed in alphabetical order
}

// Execute seeds
async function runSeeds() {
  try {
    await initSeedsTable();
    
    const executedSeeds = await getExecutedSeeds();
    const seedFiles = getSeedFiles();
    
    // Filter out seeds that have already been executed
    const pendingSeeds = seedFiles.filter(file => {
      return !executedSeeds.includes(file);
    });
    
    if (pendingSeeds.length === 0) {
      logger.info('No pending seeds');
      return;
    }
    
    logger.info(`Found ${pendingSeeds.length} pending seeds`);
    
    // Execute each pending seed in a transaction
    for (const seedFile of pendingSeeds) {
      const seed = require(path.join(__dirname, seedFile));
      
      const transaction = await sequelize.transaction();
      
      try {
        logger.info(`Executing seed: ${seedFile}`);
        await seed.up(sequelize.getQueryInterface(), sequelize);
        
        // Record the seed
        await sequelize.query(
          'INSERT INTO seeds (name) VALUES (?);',
          {
            replacements: [seedFile],
            transaction
          }
        );
        
        await transaction.commit();
        logger.info(`Seed ${seedFile} executed successfully`);
      } catch (error) {
        await transaction.rollback();
        logger.error(`Seed ${seedFile} failed:`, error);
        throw error;
      }
    }
    
    logger.info('All seeds executed successfully');
  } catch (error) {
    logger.error('Seeding process failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Execute seed rollback
async function rollbackSeed() {
  try {
    await initSeedsTable();
    
    // Get the last executed seed
    const [results] = await sequelize.query(
      'SELECT name FROM seeds ORDER BY id DESC LIMIT 1;'
    );
    
    if (results.length === 0) {
      logger.info('No seeds to roll back');
      return;
    }
    
    const lastSeed = results[0].name;
    const seed = require(path.join(__dirname, lastSeed));
    
    const transaction = await sequelize.transaction();
    
    try {
      logger.info(`Rolling back seed: ${lastSeed}`);
      
      if (typeof seed.down !== 'function') {
        throw new Error(`Seed ${lastSeed} does not have a down function`);
      }
      
      await seed.down(sequelize.getQueryInterface(), sequelize);
      
      // Remove the seed record
      await sequelize.query(
        'DELETE FROM seeds WHERE name = ?;',
        {
          replacements: [lastSeed],
          transaction
        }
      );
      
      await transaction.commit();
      logger.info(`Seed ${lastSeed} rolled back successfully`);
    } catch (error) {
      await transaction.rollback();
      logger.error(`Rollback of seed ${lastSeed} failed:`, error);
      throw error;
    }
  } catch (error) {
    logger.error('Rollback process failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Create a new seed file
function createSeed(name) {
  if (!name) {
    logger.error('Seed name is required');
    process.exit(1);
  }
  
  // Format the seed filename
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const filename = `${timestamp}-${name}.js`;
  
  // Read template file
  const templatePath = path.join(__dirname, 'seed-template.js');
  const template = fs.existsSync(templatePath)
    ? fs.readFileSync(templatePath, 'utf8')
    : `'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add seed code here
  },

  down: async (queryInterface, Sequelize) => {
    // Add rollback code here
  }
};
`;
  
  // Write new seed file
  const seedPath = path.join(__dirname, filename);
  fs.writeFileSync(seedPath, template);
  
  logger.info(`Seed file created: ${filename}`);
}

// Main function
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'up':
    case 'seed':
      await runSeeds();
      break;
    case 'down':
    case 'rollback':
      await rollbackSeed();
      break;
    case 'create':
      createSeed(process.argv[3]);
      break;
    default:
      logger.info(`
Usage:
  node seed.js up|seed       # Run all pending seeds
  node seed.js down|rollback # Rollback the last seed
  node seed.js create NAME   # Create a new seed
      `);
  }
  
  process.exit(0);
}

// Run the script
main(); 