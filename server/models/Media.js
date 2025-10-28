const { DataTypes } = require('sequelize');
const sequelize = require('./index');

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
    }
  ]
});

module.exports = Media;

