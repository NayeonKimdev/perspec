'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reports', {
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
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      personality: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      strengths: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      improvements: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      career_suggestions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      lifestyle_recommendations: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      relationship_style: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      growth_roadmap: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      cautions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      data_sources: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 인덱스 추가
    await queryInterface.addIndex('reports', ['user_id'], {
      name: 'reports_user_id_idx'
    });

    await queryInterface.addIndex('reports', ['created_at'], {
      name: 'reports_created_at_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reports');
  }
};


