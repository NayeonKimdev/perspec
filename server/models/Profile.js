const { DataTypes } = require('sequelize');
const sequelize = require('./index');

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

