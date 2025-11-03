'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // ENUM 타입 먼저 생성
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_text_documents_document_type" AS ENUM('note', 'diary', 'json', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_text_documents_analysis_status" AS ENUM('pending', 'analyzing', 'completed', 'failed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.createTable('text_documents', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      file_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: false
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      document_type: {
        type: Sequelize.ENUM('note', 'diary', 'json', 'other'),
        defaultValue: 'other',
        allowNull: false
      },
      analysis_status: {
        type: Sequelize.ENUM('pending', 'analyzing', 'completed', 'failed'),
        defaultValue: 'pending',
        allowNull: false
      },
      analysis_result: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: null
      },
      analyzed_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      analysis_error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // 인덱스 생성
    await queryInterface.addIndex('text_documents', ['user_id']);
    await queryInterface.addIndex('text_documents', ['created_at']);
    await queryInterface.addIndex('text_documents', ['analysis_status']);
    await queryInterface.addIndex('text_documents', ['document_type']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('text_documents');
    
    // ENUM 타입 제거 (선택적)
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_text_documents_document_type";
    `);
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS "enum_text_documents_analysis_status";
    `);
  }
};

