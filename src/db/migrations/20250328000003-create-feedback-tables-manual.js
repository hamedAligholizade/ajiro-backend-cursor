'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use raw SQL for creating tables to avoid DataTypes issues
    
    // First create the feedback_forms table
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS feedback_forms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    // Check if the enum type already exists and create it if not
    try {
      await queryInterface.sequelize.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_question_type') THEN
            CREATE TYPE feedback_question_type AS ENUM ('rating', 'text', 'multiple_choice', 'checkbox');
          END IF;
        END
        $$;
      `);
    } catch (error) {
      console.log('Error checking/creating enum type:', error);
      // Continue with migration even if this fails
    }
    
    // Create the remaining tables
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS feedback_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id UUID NOT NULL REFERENCES feedback_forms(id) ON UPDATE CASCADE ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        question_type feedback_question_type NOT NULL,
        options JSONB,
        is_required BOOLEAN DEFAULT TRUE,
        sequence INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS feedback_responses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        form_id UUID NOT NULL REFERENCES feedback_forms(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        customer_id UUID NOT NULL REFERENCES customers(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        sale_id UUID REFERENCES orders(id) ON UPDATE CASCADE ON DELETE SET NULL,
        response_date TIMESTAMP NOT NULL DEFAULT NOW(),
        overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS feedback_response_details (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        response_id UUID NOT NULL REFERENCES feedback_responses(id) ON UPDATE CASCADE ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES feedback_questions(id) ON UPDATE CASCADE ON DELETE CASCADE,
        answer_text TEXT,
        answer_rating INTEGER,
        answer_options JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_feedback_questions_form_id ON feedback_questions(form_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_responses_form_id ON feedback_responses(form_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_responses_customer_id ON feedback_responses(customer_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_responses_sale_id ON feedback_responses(sale_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_response_details_response_id ON feedback_response_details(response_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_response_details_question_id ON feedback_response_details(question_id);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS feedback_response_details;
      DROP TABLE IF EXISTS feedback_responses;
      DROP TABLE IF EXISTS feedback_questions;
      DROP TABLE IF EXISTS feedback_forms;
      DROP TYPE IF EXISTS feedback_question_type;
    `);
  }
}; 