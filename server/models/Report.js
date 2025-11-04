const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Report = sequelize.define('Report', {
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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  summary: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  personality: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  strengths: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  improvements: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  career_suggestions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  lifestyle_recommendations: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  relationship_style: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  growth_roadmap: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  cautions: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  data_sources: {
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
  tableName: 'reports',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = Report;


