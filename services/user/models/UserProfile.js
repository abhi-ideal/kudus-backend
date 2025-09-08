
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en'
  },
  maturityLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 18,
    validate: {
      min: 0,
      max: 18
    }
  },
  isOwner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Indicates if this profile is the account owner profile'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  parentalControls: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'user_profiles',
  timestamps: true
});

module.exports = UserProfile;
