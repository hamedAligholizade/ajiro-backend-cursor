'use strict';

/**
 * Seed template
 * 
 * This is a template for new database seeds.
 * Seeds are used to populate the database with initial data.
 */
module.exports = {
  /**
   * Run the seed
   * @param {import('sequelize').QueryInterface} queryInterface - Sequelize Query Interface
   * @param {import('sequelize')} Sequelize - Sequelize constructor
   * @returns {Promise<void>}
   */
  up: async (queryInterface, Sequelize) => {
    /**
     * Example:
     * 
     * await queryInterface.bulkInsert('categories', [
     *   {
     *     id: Sequelize.literal('uuid_generate_v4()'),
     *     name: 'Food',
     *     description: 'Food and beverage items',
     *     is_active: true,
     *     created_at: new Date(),
     *     updated_at: new Date()
     *   },
     *   {
     *     id: Sequelize.literal('uuid_generate_v4()'),
     *     name: 'Drinks',
     *     description: 'Beverages',
     *     is_active: true,
     *     created_at: new Date(),
     *     updated_at: new Date()
     *   }
     * ], {});
     */
  },

  /**
   * Rollback the seed
   * @param {import('sequelize').QueryInterface} queryInterface - Sequelize Query Interface
   * @param {import('sequelize')} Sequelize - Sequelize constructor
   * @returns {Promise<void>}
   */
  down: async (queryInterface, Sequelize) => {
    /**
     * Example:
     * 
     * await queryInterface.bulkDelete('categories', {
     *   name: {
     *     [Sequelize.Op.in]: ['Food', 'Drinks']
     *   }
     * }, {});
     */
  }
}; 