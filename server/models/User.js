/**
 * @fileoverview User 모델 정의
 * @module models/User
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./index');

/**
 * User 모델
 * @typedef {Object} UserAttributes
 * @property {string} id - 사용자 UUID
 * @property {string} email - 사용자 이메일 (고유)
 * @property {string} password - 해시된 비밀번호
 * @property {boolean} email_verified - 이메일 인증 여부
 * @property {string|null} email_verification_token - 이메일 인증 토큰
 * @property {Date|null} email_verification_token_expires - 이메일 인증 토큰 만료 시간
 * @property {string|null} password_reset_token - 비밀번호 재설정 토큰
 * @property {Date|null} password_reset_token_expires - 비밀번호 재설정 토큰 만료 시간
 * @property {Date} created_at - 생성일시
 * @property {Date} updated_at - 수정일시
 */

/**
 * @type {import('sequelize').ModelCtor<import('sequelize').Model<UserAttributes>>}
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [8, 255] // 최소 8자 이상
    }
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  email_verification_token: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  email_verification_token_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  password_reset_token: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  password_reset_token_expires: {
    type: DataTypes.DATE,
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
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = User;
