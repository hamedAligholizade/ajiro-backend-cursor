const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const config = require('../../config');
const logger = require('../../utils/logger');

// Initialize Sequelize with database configuration
const sequelize = new Sequelize(
  config.database.url || 
  `postgres://${config.database.user}:${config.database.password}@${config.database.host}:${config.database.port}/${config.database.name}`,
  {
    dialect: config.database.dialect,
    logging: config.database.logging ? msg => logger.debug(msg) : false
  }
);

// Migration configuration
const migrationPath = path.resolve(__dirname);
const migrationsTable = 'migrations';

// Creates the migrations table if it doesn't exist
async function initMigrationTable() {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS ${migrationsTable} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('Migration table initialized');
  } catch (error) {
    logger.error('Error initializing migration table:', error);
    throw error;
  }
}

// Gets the list of migration files from the directory
function getMigrationFiles() {
  try {
    // Get all JS files in the migrations directory
    const files = fs.readdirSync(migrationPath)
      .filter(file => 
        file.endsWith('.js') && 
        file !== path.basename(__filename) && 
        file !== 'migration-template.js' &&
        file === '20250328000000-initialize-schema.js'
      )
      .sort(); // Sort alphabetically to maintain order
    
    return files;
  } catch (error) {
    logger.error('Error getting migration files:', error);
    throw error;
  }
}

// Gets the list of already executed migrations
async function getExecutedMigrations() {
  try {
    const [executed] = await sequelize.query(`SELECT name FROM ${migrationsTable}`);
    return executed.map(m => m.name);
  } catch (error) {
    logger.error('Error getting executed migrations:', error);
    throw error;
  }
}

// Executes a specific migration
async function executeMigration(file, direction = 'up') {
  try {
    logger.info(`Executing migration ${direction}: ${file}`);
    
    // Require the migration file
    const migration = require(path.join(migrationPath, file));
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Execute the migration
      await migration[direction](sequelize.getQueryInterface(), Sequelize);
      
      // If it's an "up" migration, add it to the migrations table
      if (direction === 'up') {
        await sequelize.query(
          `INSERT INTO ${migrationsTable} (name) VALUES (:name)`,
          {
            replacements: { name: file },
            transaction
          }
        );
      } else {
        // If it's a "down" migration, remove it from the migrations table
        await sequelize.query(
          `DELETE FROM ${migrationsTable} WHERE name = :name`,
          {
            replacements: { name: file },
            transaction
          }
        );
      }
      
      // Commit the transaction
      await transaction.commit();
      logger.info(`Migration ${direction} executed successfully: ${file}`);
    } catch (error) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Error executing migration ${direction} ${file}:`, error);
    throw error;
  }
}

// Main migration function
async function migrate(direction = 'up') {
  try {
    // Connect to the database
    await sequelize.authenticate();
    logger.info('Connected to the database');
    
    // Initialize migrations table
    await initMigrationTable();
    
    // Get migration files
    const migrationFiles = getMigrationFiles();
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    
    // Determine pending migrations based on direction
    let pendingMigrations = [];
    
    if (direction === 'up') {
      // For "up" direction, get all files that haven't been executed yet
      pendingMigrations = migrationFiles.filter(file => !executedMigrations.includes(file));
    } else if (direction === 'down') {
      // For "down" direction, get the last executed migration
      const reversedExecuted = [...executedMigrations]
        .filter(file => migrationFiles.includes(file)) // Only include files that exist
        .sort((a, b) => {
          // Sort by timestamp if available, otherwise by name
          const timestampA = a.match(/^\d+/);
          const timestampB = b.match(/^\d+/);
          if (timestampA && timestampB) {
            return parseInt(timestampB[0]) - parseInt(timestampA[0]);
          }
          return b.localeCompare(a);
        });
      
      // Only revert the most recent migration if any
      if (reversedExecuted.length > 0) {
        pendingMigrations = [reversedExecuted[0]];
      }
    }
    
    // Log pending migrations
    if (pendingMigrations.length === 0) {
      logger.info(`No pending migrations for ${direction} direction`);
      return;
    }
    
    logger.info(`Found ${pendingMigrations.length} pending migrations for ${direction} direction`);
    
    // Execute each pending migration
    for (const file of pendingMigrations) {
      await executeMigration(file, direction);
    }
    
    logger.info('All migrations executed successfully');
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
}

// Command line interface
if (require.main === module) {
  const direction = process.argv[2] === 'down' ? 'down' : 'up';
  migrate(direction).catch(err => {
    logger.error('Migration script error:', err);
    process.exit(1);
  });
}

module.exports = {
  migrate,
  sequelize
}; 