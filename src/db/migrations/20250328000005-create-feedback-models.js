'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Use raw SQL for creating tables to avoid DataTypes issues
    await queryInterface.sequelize.query(`
      -- Create the feedback_forms table
      CREATE TABLE IF NOT EXISTS feedback_forms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(100) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      
      -- Create the question type enum if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_question_type') THEN
          CREATE TYPE feedback_question_type AS ENUM ('rating', 'text', 'multiple_choice', 'checkbox');
        END IF;
      END
      $$;
      
      -- Create the feedback_questions table
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
      
      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_feedback_questions_form_id ON feedback_questions(form_id);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS feedback_questions;
      DROP TABLE IF EXISTS feedback_forms;
      DROP TYPE IF EXISTS feedback_question_type;
    `);
  }
}; 