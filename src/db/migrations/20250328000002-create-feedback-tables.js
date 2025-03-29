'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create feedback_forms table
    await queryInterface.createTable('feedback_forms', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.DataTypes.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      }
    });

    // Create feedback_questions table
    await queryInterface.createTable('feedback_questions', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        primaryKey: true
      },
      form_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'feedback_forms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      question_text: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: false
      },
      question_type: {
        type: Sequelize.DataTypes.ENUM('rating', 'text', 'multiple_choice', 'checkbox'),
        allowNull: false
      },
      options: {
        type: Sequelize.DataTypes.JSONB,
        allowNull: true
      },
      is_required: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: true
      },
      sequence: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      }
    });

    // Create feedback_responses table
    await queryInterface.createTable('feedback_responses', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        primaryKey: true
      },
      form_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'feedback_forms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      customer_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      sale_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      response_date: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.DataTypes.NOW
      },
      overall_rating: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 5
        }
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      }
    });

    // Create feedback_response_details table
    await queryInterface.createTable('feedback_response_details', {
      id: {
        type: Sequelize.DataTypes.UUID,
        defaultValue: Sequelize.DataTypes.UUIDV4,
        primaryKey: true
      },
      response_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'feedback_responses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      question_id: {
        type: Sequelize.DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'feedback_questions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      answer_text: {
        type: Sequelize.DataTypes.TEXT,
        allowNull: true
      },
      answer_rating: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: true
      },
      answer_options: {
        type: Sequelize.DataTypes.JSONB,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false
      }
    });

    // Create indexes for better query performance
    await queryInterface.addIndex('feedback_questions', ['form_id']);
    await queryInterface.addIndex('feedback_responses', ['form_id']);
    await queryInterface.addIndex('feedback_responses', ['customer_id']);
    await queryInterface.addIndex('feedback_responses', ['sale_id']);
    await queryInterface.addIndex('feedback_response_details', ['response_id']);
    await queryInterface.addIndex('feedback_response_details', ['question_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('feedback_response_details');
    await queryInterface.dropTable('feedback_responses');
    await queryInterface.dropTable('feedback_questions');
    await queryInterface.dropTable('feedback_forms');
  }
}; 