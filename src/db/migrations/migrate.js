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

// Clear all existing tables for a fresh start
async function clearDatabase() {
  try {
    // Drop all tables except the migrations table
    await sequelize.query(`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema() AND tablename != '${migrationsTable}') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    
    // Clear migrations table
    await sequelize.query(`DELETE FROM ${migrationsTable}`);
    
    logger.info('Database cleared successfully');
  } catch (error) {
    logger.error('Error clearing database:', error);
    throw error;
  }
}

// Gets the list of migration files from the directory
function getMigrationFiles() {
  try {
    // Define a specific order for migrations to handle dependencies
    const orderedMigrations = [
      // Core schema first
      '20250328000000-initialize-schema.js',
      // User and customer tables (authentication related)
      '20250328000001-create-user-and-customer-tables.js',
      // Base data models
      '20250328000000-create-product-tables.js',
      '20250328000010-create-order-tables.js',
      '20250328000020-create-shop-tables.js',
      // Additional features
      '20250328000002-create-feedback-tables.js',
      '20250328000003-create-feedback-tables-manual.js',
      '20250328000004-create-order-tables-manual.js',
      '20250328000005-create-feedback-models.js'
    ];
    
    // Get all migration files that exist in the directory
    const allFiles = fs.readdirSync(migrationPath)
      .filter(file => 
        file.endsWith('.js') && 
        file !== path.basename(__filename) && 
        file !== 'migration-template.js'
      );
    
    // Log which files were found
    logger.info(`Found migration files: ${allFiles.join(', ')}`);
    
    // Get only the migration files that exist in our ordered list
    const validOrderedMigrations = orderedMigrations.filter(file => allFiles.includes(file));
    
    // Add any additional migrations not in our ordered list (at the end)
    const additionalMigrations = allFiles.filter(file => !orderedMigrations.includes(file));
    
    // Return the combined list (ordered migrations first, then any others)
    return [...validOrderedMigrations, ...additionalMigrations];
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
async function migrate(direction = 'up', shouldClearDatabase = false) {
  try {
    // Connect to the database
    await sequelize.authenticate();
    logger.info('Connected to the database');
    
    // Initialize migrations table
    await initMigrationTable();
    
    // Clear the database if requested (careful with this in production!)
    if (shouldClearDatabase && direction === 'up') {
      logger.warn('Clearing database before migrations...');
      await clearDatabase();
    }
    
    // Get migration files
    const migrationFiles = getMigrationFiles();
    logger.info(`Migration files to process: ${migrationFiles.join(', ')}`);
    
    // Get executed migrations
    const executedMigrations = await getExecutedMigrations();
    logger.info(`Already executed migrations: ${executedMigrations.join(', ')}`);
    
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
    
    logger.info(`Found ${pendingMigrations.length} pending migrations for ${direction} direction: ${pendingMigrations.join(', ')}`);
    
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
  const clearDb = process.argv.includes('--clear');
  
  migrate(direction, clearDb).catch(err => {
    logger.error('Migration script error:', err);
    process.exit(1);
  });
}

module.exports = {
  migrate,
  sequelize
}; 