'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('emotion_analyses', {
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
      primary_emotions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      emotion_timeline: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      positive_ratio: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50,
        validate: {
          min: 0,
          max: 100
        }
      },
      negative_ratio: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50,
        validate: {
          min: 0,
          max: 100
        }
      },
      stability_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50,
        validate: {
          min: 0,
          max: 100
        }
      },
      health_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 50,
        validate: {
          min: 0,
          max: 100
        }
      },
      concerns: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      suggestions: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      data_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    await queryInterface.addIndex('emotion_analyses', ['user_id'], {
      name: 'emotion_analyses_user_id_idx'
    });

    await queryInterface.addIndex('emotion_analyses', ['created_at'], {
      name: 'emotion_analyses_created_at_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('emotion_analyses');
  }
};


