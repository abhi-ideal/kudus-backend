
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginHistory = sequelize.define('LoginHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  loginAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  logoutAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  deviceType: {
    type: DataTypes.ENUM('web', 'mobile', 'tv', 'tablet', 'desktop'),
    allowNull: true
  },
  deviceInfo: {
    type: DataTypes.JSON,
    allowNull: true
  },
  location: {
    type: DataTypes.JSON,
    allowNull: true
  },
  sessionDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Session duration in seconds'
  },
  loginMethod: {
    type: DataTypes.ENUM('firebase', 'google', 'facebook', 'email'),
    defaultValue: 'firebase'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'login_history',
  timestamps: true
});

module.exports = LoginHistory;
