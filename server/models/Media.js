/**
 * @fileoverview Media 모델 정의
 * @module models/Media
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./index');

/**
 * Media 모델
 * @typedef {Object} MediaAttributes
 * @property {string} id - 미디어 UUID
 * @property {string} user_id - 사용자 UUID (외래키)
 * @property {string} file_name - 원본 파일명
 * @property {string} file_path - 파일 저장 경로
 * @property {string} file_type - MIME 타입
 * @property {number} file_size - 파일 크기 (바이트)
 * @property {string} file_url - 파일 접근 URL
 * @property {Object} metadata - 추가 메타데이터 (JSONB)
 * @property {'pending'|'analyzing'|'completed'|'failed'} analysis_status - 분석 상태
 * @property {Object|null} analysis_result - 분석 결과 (JSONB)
 * @property {Date|null} analyzed_at - 분석 완료일시
 * @property {string|null} analysis_error - 분석 오류 메시지
 * @property {Date} created_at - 생성일시
 * @property {Date} updated_at - 수정일시
 */

/**
 * @type {import('sequelize').ModelCtor<import('sequelize').Model<MediaAttributes>>}
 */
const Media = sequelize.define('Media', {
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
  file_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
  },
  analysis_status: {
    type: DataTypes.ENUM('pending', 'analyzing', 'completed', 'failed'),
    defaultValue: 'pending',
    allowNull: false
  },
  analysis_result: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null
  },
  analyzed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  analysis_error: {
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
  tableName: 'media',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['analysis_status']
    }
  ]
});

module.exports = Media;

