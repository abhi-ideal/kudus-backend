
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

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
      model: User,
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
    defaultValue: 18
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'user_profiles',
  timestamps: true
});

// Define associations
User.hasMany(UserProfile, { foreignKey: 'userId', as: 'profiles' });
UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = UserProfile;
