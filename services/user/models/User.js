
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
    allowNull: true
  },
  photoURL: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  subscriptionType: {
    type: DataTypes.ENUM('free', 'premium', 'family'),
    defaultValue: 'free'
  },
  subscriptionStatus: {
    type: DataTypes.ENUM('active', 'cancelled', 'expired'),
    defaultValue: 'active'
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Define associations
User.associate = function(models) {
  User.hasMany(models.UserProfile, {
    foreignKey: 'userId',
    as: 'profiles'
  });
};

module.exports = User;
