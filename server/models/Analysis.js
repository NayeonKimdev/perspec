const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Analysis = sequelize.define('Analysis', {
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
    }
  },
  profile_snapshot: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  personality_analysis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  career_recommendations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  hobby_suggestions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  travel_recommendations: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  additional_insights: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_enhanced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  image_analysis_summary: {
    type: DataTypes.JSONB,
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
  tableName: 'analyses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Analysis;

