const { DataTypes } = require('sequelize');
const sequelize = require('./index');

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

