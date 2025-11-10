/**
 * @fileoverview 비밀번호 재설정 토큰 추가 마이그레이션
 * User 모델에 비밀번호 재설정 관련 필드 추가
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'password_reset_token', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      comment: '비밀번호 재설정 토큰'
    });

    await queryInterface.addColumn('users', 'password_reset_token_expires', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '비밀번호 재설정 토큰 만료 시간'
    });

    // 인덱스 추가 (토큰으로 빠른 조회를 위해)
    await queryInterface.addIndex('users', ['password_reset_token'], {
      name: 'users_password_reset_token_idx',
      unique: true,
      where: {
        password_reset_token: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'users_password_reset_token_idx');
    await queryInterface.removeColumn('users', 'password_reset_token_expires');
    await queryInterface.removeColumn('users', 'password_reset_token');
  }
};

