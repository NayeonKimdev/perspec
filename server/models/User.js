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
 * @property {string|null} password - 해시된 비밀번호 (소셜 로그인 사용자는 null)
 * @property {boolean} email_verified - 이메일 인증 여부
 * @property {string|null} email_verification_token - 이메일 인증 토큰
 * @property {Date|null} email_verification_token_expires - 이메일 인증 토큰 만료 시간
 * @property {string|null} password_reset_token - 비밀번호 재설정 토큰
 * @property {Date|null} password_reset_token_expires - 비밀번호 재설정 토큰 만료 시간
 * @property {string|null} provider - 소셜 로그인 제공자 (google, github 등)
 * @property {string|null} provider_id - 소셜 로그인 제공자의 사용자 ID
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
        allowNull: true, // 소셜 로그인 사용자는 비밀번호가 없음
        validate: {
          // 비밀번호가 있으면 최소 8자 이상이어야 함
          isPasswordValid: function(value) {
            if (value && value.length < 8) {
              throw new Error('비밀번호는 최소 8자 이상이어야 합니다.');
            }
          }
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
  provider: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '소셜 로그인 제공자 (google, github 등)'
  },
  provider_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: '소셜 로그인 제공자의 사용자 ID'
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
