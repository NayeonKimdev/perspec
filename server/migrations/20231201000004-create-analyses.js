'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('analyses', {
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
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      profile_snapshot: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      personality_analysis: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      career_recommendations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      hobby_suggestions: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      travel_recommendations: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      additional_insights: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('analyses', ['user_id'], {
      name: 'analyses_user_id_idx'
    });

    await queryInterface.addIndex('analyses', ['created_at'], {
      name: 'analyses_created_at_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('analyses');
  }
};

