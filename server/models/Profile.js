/**
 * @fileoverview Profile 모델 정의
 * @module models/Profile
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./index');

/**
 * Profile 모델
 * @typedef {Object} ProfileAttributes
 * @property {string} id - 프로필 UUID
 * @property {string} user_id - 사용자 UUID (외래키, 고유)
 * @property {string|null} interests - 관심사
 * @property {string|null} hobbies - 취미
 * @property {string|null} ideal_type - 이상형
 * @property {string|null} ideal_life - 이상적인 삶
 * @property {string|null} current_job - 현재 직업
 * @property {string|null} future_dream - 미래 꿈
 * @property {string|null} personality - 성격
 * @property {string|null} concerns - 걱정사항
 * @property {string|null} dreams - 꿈
 * @property {string|null} dating_style - 연애 스타일
 * @property {string|null} other_info - 기타 정보
 * @property {Date} created_at - 생성일시
 * @property {Date} updated_at - 수정일시
 */

/**
 * @type {import('sequelize').ModelCtor<import('sequelize').Model<ProfileAttributes>>}
 */
const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  interests: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hobbies: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ideal_type: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ideal_life: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  current_job: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  future_dream: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  personality: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  concerns: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dreams: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  dating_style: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  other_info: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Profile;

