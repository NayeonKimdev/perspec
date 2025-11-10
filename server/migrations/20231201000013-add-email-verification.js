/**
 * @fileoverview 이메일 인증 토큰 추가 마이그레이션
 * User 모델에 이메일 인증 관련 필드 추가
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'email_verified', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '이메일 인증 여부'
    });

    await queryInterface.addColumn('users', 'email_verification_token', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      comment: '이메일 인증 토큰'
    });

    await queryInterface.addColumn('users', 'email_verification_token_expires', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: '이메일 인증 토큰 만료 시간'
    });

    // 인덱스 추가 (토큰으로 빠른 조회를 위해)
    await queryInterface.addIndex('users', ['email_verification_token'], {
      name: 'users_email_verification_token_idx',
      unique: true,
      where: {
        email_verification_token: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('users', 'users_email_verification_token_idx');
    await queryInterface.removeColumn('users', 'email_verification_token_expires');
    await queryInterface.removeColumn('users', 'email_verification_token');
    await queryInterface.removeColumn('users', 'email_verified');
  }
};

