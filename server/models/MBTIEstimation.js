const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const MBTIEstimation = sequelize.define('MBTIEstimation', {
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
  mbti_type: {
    type: DataTypes.STRING(4),
    allowNull: false
  },
  dimensions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  confidence: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    }
  },
  characteristics: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  suitable_careers: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  suitable_environments: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: []
  },
  growth_suggestions: {
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
  tableName: 'mbti_estimations',
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
      fields: ['mbti_type']
    }
  ]
});

module.exports = MBTIEstimation;


