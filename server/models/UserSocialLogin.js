/**
 * @fileoverview UserSocialLogin 모델 정의
 * @module models/UserSocialLogin
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const User = require('./User');

/**
 * UserSocialLogin 모델
 * 사용자와 소셜 로그인 제공자 간의 연결 정보를 저장
 */
const UserSocialLogin = sequelize.define('UserSocialLogin', {
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
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    comment: '사용자 ID'
  },
  provider: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: '소셜 로그인 제공자 (google, kakao, naver 등)'
  },
  provider_id: {
    type: DataTypes.STRING,
    allowNull: false,
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
  tableName: 'user_social_logins',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['provider', 'provider_id'],
      name: 'user_social_logins_provider_provider_id_unique'
    },
    {
      fields: ['user_id'],
      name: 'user_social_logins_user_id_idx'
    }
  ]
});

// User와의 관계 설정
UserSocialLogin.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

User.hasMany(UserSocialLogin, {
  foreignKey: 'user_id',
  as: 'socialLogins'
});

module.exports = UserSocialLogin;

