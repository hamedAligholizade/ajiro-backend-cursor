'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  /**
   * Create admin user
   * @param {import('sequelize').QueryInterface} queryInterface - Sequelize Query Interface
   * @param {import('sequelize')} Sequelize - Sequelize constructor
   * @returns {Promise<void>}
   */
  up: async (queryInterface, Sequelize) => {
    // Check if admin user already exists
    const [existingAdmin] = await queryInterface.sequelize.query(
      'SELECT * FROM users WHERE email = :email',
      {
        replacements: { email: 'admin@ajiro.com' },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('ajiro2024', 10);
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
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    console.log('Admin user created successfully');
  },

  /**
   * Remove admin user
   * @param {import('sequelize').QueryInterface} queryInterface - Sequelize Query Interface
   * @param {import('sequelize')} Sequelize - Sequelize constructor
   * @returns {Promise<void>}
   */
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: 'admin@ajiro.com'
    }, {});
  }
}; 