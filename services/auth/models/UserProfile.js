
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Define UserProfile model for auth service (referencing user service tables)
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
  isKidsProfile: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ageRating: {
    type: DataTypes.ENUM('G', 'PG', 'PG-13', 'R', 'NC-17'),
    defaultValue: 'R'
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'en'
  },
  autoplayNext: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  autoplayPreviews: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  subtitles: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  subtitleLanguage: {
    type: DataTypes.STRING,
    defaultValue: 'en'
  },
  audioLanguage: {
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
  }
}, {
  tableName: 'user_profiles',
  timestamps: true
});

module.exports = UserProfile;
