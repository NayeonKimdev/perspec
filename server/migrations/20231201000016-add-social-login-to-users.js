'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // password 필드를 nullable로 변경
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // provider 필드 추가
    await queryInterface.addColumn('users', 'provider', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '소셜 로그인 제공자 (google, github 등)'
    });

    // provider_id 필드 추가
    await queryInterface.addColumn('users', 'provider_id', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: '소셜 로그인 제공자의 사용자 ID'
    });

    // provider와 provider_id 복합 인덱스 추가
    await queryInterface.addIndex('users', ['provider', 'provider_id'], {
      name: 'users_provider_provider_id_idx',
      unique: false
    });

    // provider_id 단일 인덱스 추가 (조회 성능 향상)
    await queryInterface.addIndex('users', ['provider_id'], {
      name: 'users_provider_id_idx',
      unique: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // 인덱스 제거
    await queryInterface.removeIndex('users', 'users_provider_id_idx');
    await queryInterface.removeIndex('users', 'users_provider_provider_id_idx');

    // 컬럼 제거
    await queryInterface.removeColumn('users', 'provider_id');
    await queryInterface.removeColumn('users', 'provider');

    // password 필드를 다시 not null로 변경
    await queryInterface.changeColumn('users', 'password', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
};

