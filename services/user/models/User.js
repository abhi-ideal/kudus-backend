
const { DataTypes } = require('sequelize');
const sequelize = require('../../../shared/config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firebaseUid: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  subscription: {
    type: DataTypes.ENUM('free', 'premium', 'family'),
    defaultValue: 'free'
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {
      language: 'en',
      genres: [],
      adultContent: false
    }
  },
  lastLoginAt: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  tableName: 'users'
});

module.exports = User;
