/**
 * @fileoverview UserActivity 모델 정의
 * 사용자 활동 로그를 저장하는 모델
 * @module models/UserActivity
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./index');

/**
 * UserActivity 모델
 * @typedef {Object} UserActivityAttributes
 * @property {string} id - 활동 로그 UUID
 * @property {string} user_id - 사용자 UUID (외래키)
 * @property {string} action - 활동 타입
 * @property {string|null} resource_type - 리소스 타입
 * @property {string|null} resource_id - 리소스 ID
 * @property {Object} metadata - 추가 메타데이터 (JSONB)
 * @property {string|null} ip_address - 요청 IP 주소
 * @property {string|null} user_agent - User-Agent 정보
 * @property {Date} created_at - 생성일시
 */

/**
 * @type {import('sequelize').ModelCtor<import('sequelize').Model<UserActivityAttributes>>}
 */
const UserActivity = sequelize.define('UserActivity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  resource_type: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resource_id: {
    type: DataTypes.UUID,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // 활동 로그는 수정되지 않음
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['action']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['user_id', 'created_at']
    },
    {
      fields: ['action', 'created_at']
    }
  ]
});

module.exports = UserActivity;

