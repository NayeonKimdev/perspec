'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      interests: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      hobbies: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ideal_type: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ideal_life: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      current_job: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      future_dream: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      personality: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      concerns: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // user_id 인덱스 추가
    await queryInterface.addIndex('profiles', ['user_id'], {
      unique: true,
      name: 'profiles_user_id_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('profiles');
  }
};



