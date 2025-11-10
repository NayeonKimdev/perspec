/**
 * @fileoverview 사용자 활동 로그 테이블 생성 마이그레이션
 * 사용자 행동 추적 및 분석을 위한 활동 로그 저장
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_activities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        comment: '사용자 ID'
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '활동 타입 (login, logout, upload_media, delete_media, 등)'
      },
      resource_type: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '리소스 타입 (media, document, profile 등)'
      },
      resource_id: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: '리소스 ID'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
        comment: '추가 메타데이터 (IP 주소, User-Agent, 파일명 등)'
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: '요청 IP 주소'
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'User-Agent 정보'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // 인덱스 추가
    await queryInterface.addIndex('user_activities', ['user_id'], {
      name: 'user_activities_user_id_idx'
    });

    await queryInterface.addIndex('user_activities', ['action'], {
      name: 'user_activities_action_idx'
    });

    await queryInterface.addIndex('user_activities', ['created_at'], {
      name: 'user_activities_created_at_idx'
    });

    // 복합 인덱스 (사용자별 활동 조회 최적화)
    await queryInterface.addIndex('user_activities', ['user_id', 'created_at'], {
      name: 'user_activities_user_id_created_at_idx'
    });

    // 복합 인덱스 (활동 타입별 조회 최적화)
    await queryInterface.addIndex('user_activities', ['action', 'created_at'], {
      name: 'user_activities_action_created_at_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_activities');
  }
};

