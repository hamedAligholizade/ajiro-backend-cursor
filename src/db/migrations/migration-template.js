'use strict';

/**
 * Migration template
 * 
 * This is a template for new migrations.
 * 
 * Available methods:
 * - createTable
 * - dropTable
 * - addColumn
 * - removeColumn
 * - changeColumn
 * - renameColumn
 * - addIndex
 * - removeIndex
 * - addConstraint
 * - removeConstraint
 * 
 * For more information, see: https://sequelize.org/docs/v6/other-topics/migrations/
 */
module.exports = {
  /**
   * Run the migration
   * @param {import('sequelize').QueryInterface} queryInterface - Sequelize Query Interface
   * @param {import('sequelize')} Sequelize - Sequelize constructor
   * @returns {Promise<void>}
   */
  up: async (queryInterface, Sequelize) => {
    /**
     * Example:
     * 
     * await queryInterface.createTable('users', {
     *   id: {
     *     type: Sequelize.UUID,
     *     defaultValue: Sequelize.UUIDV4,
     *     primaryKey: true
     *   },
     *   name: {
     *     type: Sequelize.STRING,
     *     allowNull: false
     *   },
     *   created_at: {
     *     type: Sequelize.DATE,
     *     allowNull: false
     *   },
     *   updated_at: {
     *     type: Sequelize.DATE,
     *     allowNull: false
     *   }
     * });
     */
  },

  /**
   * Rollback the migration
   * @param {import('sequelize').QueryInterface} queryInterface - Sequelize Query Interface
   * @param {import('sequelize')} Sequelize - Sequelize constructor
   * @returns {Promise<void>}
   */
  down: async (queryInterface, Sequelize) => {
    /**
     * Example:
     * 
     * await queryInterface.dropTable('users');
     */
  }
}; 