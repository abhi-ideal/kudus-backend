
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firebaseUid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  profilePicture: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subscriptionType: {
    type: DataTypes.ENUM('free', 'basic', 'premium', 'family'),
    defaultValue: 'free'
  },
  subscriptionStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'canceled', 'expired'),
    defaultValue: 'inactive'
  },
  subscriptionStartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscriptionEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  parentalControls: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en'
  },
  country: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true
});

module.exports = User;
