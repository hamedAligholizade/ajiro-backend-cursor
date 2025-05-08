'use strict';

const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');

module.exports = {
  /**
   * Create admin user
   * @param {import('sequelize').QueryInterface} queryInterface - Sequelize Query Interface
   * @param {import('sequelize')} Sequelize - Sequelize constructor
   * @returns {Promise<void>}
   */
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if admin user already exists
      const [existingAdmin] = await queryInterface.sequelize.query(
        'SELECT * FROM users WHERE email = :email',
        {
          replacements: { email: 'admin@ajiro.com' },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (existingAdmin) {
        logger.info('Admin user already exists');
        return;
      }

      // Create admin user
      const hashedPassword = await bcrypt.hash('ajiro2024', 10);
      const now = new Date();
      
      await queryInterface.bulkInsert('users', [{
        id: Sequelize.literal('uuid_generate_v4()'),
        email: 'admin@ajiro.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        phone: '09123456789',
        role: 'admin',
        is_active: true,
        email_verified: true,
        phone_verified: true,
        verification_token: null,
        reset_token: null,
        reset_token_expires: null,
        last_login: null,
        created_at: now,
        updated_at: now
      }], {});

      // Verify the user was created
      const [createdAdmin] = await queryInterface.sequelize.query(
        'SELECT * FROM users WHERE email = :email',
        {
          replacements: { email: 'admin@ajiro.com' },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (createdAdmin) {
        logger.info('Admin user created successfully with ID:', createdAdmin.id);
      } else {
        throw new Error('Failed to verify admin user creation');
      }
    } catch (error) {
      logger.error('Error creating admin user:', error);
      throw error;
    }
  },

  /**
   * Remove admin user
   * @param {import('sequelize').QueryInterface} queryInterface - Sequelize Query Interface
   * @param {import('sequelize')} Sequelize - Sequelize constructor
   * @returns {Promise<void>}
   */
  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.bulkDelete('users', {
        email: 'admin@ajiro.com'
      }, {});
      logger.info('Admin user removed successfully');
    } catch (error) {
      logger.error('Error removing admin user:', error);
      throw error;
    }
  }
}; 