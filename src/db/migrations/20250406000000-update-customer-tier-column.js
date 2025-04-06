'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, check if columns exist
    const tableInfo = await queryInterface.describeTable('customers');
    
    // If we have the tier column but not the loyalty_tier column
    if (tableInfo.tier && !tableInfo.loyalty_tier) {
      // Create the ENUM type
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_customers_loyalty_tier') THEN
            CREATE TYPE enum_customers_loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
          END IF;
        END
        $$;
      `);

      // Add the new loyalty_tier column with the enum type
      await queryInterface.sequelize.query(`
        ALTER TABLE customers 
        ADD COLUMN loyalty_tier enum_customers_loyalty_tier;
      `);

      // Update the new column with values from the old column
      await queryInterface.sequelize.query(`
        UPDATE customers 
        SET loyalty_tier = tier::text::enum_customers_loyalty_tier 
        WHERE tier IN ('bronze', 'silver', 'gold', 'platinum');
      `);
      
      // Set default value for loyalty_tier column
      await queryInterface.sequelize.query(`
        ALTER TABLE customers 
        ALTER COLUMN loyalty_tier SET DEFAULT 'bronze'::enum_customers_loyalty_tier;
      `);

      // Remove the old column
      await queryInterface.removeColumn('customers', 'tier');
    }
    // If neither column exists, create loyalty_tier with enum type
    else if (!tableInfo.tier && !tableInfo.loyalty_tier) {
      // Create the ENUM type
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_customers_loyalty_tier') THEN
            CREATE TYPE enum_customers_loyalty_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum');
          END IF;
        END
        $$;
      `);

      // Add the loyalty_tier column
      await queryInterface.sequelize.query(`
        ALTER TABLE customers 
        ADD COLUMN loyalty_tier enum_customers_loyalty_tier DEFAULT 'bronze'::enum_customers_loyalty_tier;
      `);
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('customers');
    
    if (tableInfo.loyalty_tier) {
      // Create a string column tier
      await queryInterface.addColumn('customers', 'tier', {
        type: Sequelize.STRING(20),
        defaultValue: 'bronze'
      });
      
      // Copy values from loyalty_tier to tier
      await queryInterface.sequelize.query(`
        UPDATE customers SET tier = loyalty_tier::text;
      `);
      
      // Drop the loyalty_tier column
      await queryInterface.removeColumn('customers', 'loyalty_tier');
      
      // Drop the enum type
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS enum_customers_loyalty_tier;
      `);
    }
  }
}; 