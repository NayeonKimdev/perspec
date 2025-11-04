'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('mbti_estimations', {
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
      mbti_type: {
        type: Sequelize.STRING(4),
        allowNull: false
      },
      dimensions: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      confidence: {
        type: Sequelize.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100
        }
      },
      characteristics: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      suitable_careers: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      suitable_environments: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: []
      },
      growth_suggestions: {
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
    await queryInterface.addIndex('mbti_estimations', ['user_id'], {
      name: 'mbti_estimations_user_id_idx'
    });

    await queryInterface.addIndex('mbti_estimations', ['created_at'], {
      name: 'mbti_estimations_created_at_idx'
    });

    await queryInterface.addIndex('mbti_estimations', ['mbti_type'], {
      name: 'mbti_estimations_mbti_type_idx'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('mbti_estimations');
  }
};


