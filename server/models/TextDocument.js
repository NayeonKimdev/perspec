/**
 * @fileoverview TextDocument 모델 정의
 * @module models/TextDocument
 */

const { DataTypes } = require('sequelize');
const sequelize = require('./index');

/**
 * TextDocument 모델
 * @typedef {Object} TextDocumentAttributes
 * @property {string} id - 문서 UUID
 * @property {string} user_id - 사용자 UUID (외래키)
 * @property {string} file_name - 원본 파일명
 * @property {string} file_type - 파일 확장자
 * @property {string} file_path - 파일 저장 경로
 * @property {number} file_size - 파일 크기 (바이트)
 * @property {string} content - 파일 내용 (텍스트)
 * @property {'note'|'diary'|'json'|'other'} document_type - 문서 타입
 * @property {'pending'|'analyzing'|'completed'|'failed'} analysis_status - 분석 상태
 * @property {Object|null} analysis_result - 분석 결과 (JSONB)
 * @property {Date|null} analyzed_at - 분석 완료일시
 * @property {string|null} analysis_error - 분석 오류 메시지
 * @property {Object} metadata - 추가 메타데이터 (JSONB)
 * @property {Date} created_at - 생성일시
 * @property {Date} updated_at - 수정일시
 */

/**
 * @type {import('sequelize').ModelCtor<import('sequelize').Model<TextDocumentAttributes>>}
 */
const TextDocument = sequelize.define('TextDocument', {
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
  file_type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_path: {
    type: DataTypes.STRING,
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  document_type: {
    type: DataTypes.ENUM('note', 'diary', 'json', 'other'),
    defaultValue: 'other',
    allowNull: false
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
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: {}
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
  tableName: 'text_documents',
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
    },
    {
      fields: ['document_type']
    }
  ]
});

module.exports = TextDocument;

