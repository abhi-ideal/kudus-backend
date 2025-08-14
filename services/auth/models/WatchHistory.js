
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const UserProfile = require('./UserProfile');

const WatchHistory = sequelize.define('WatchHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: UserProfile,
      key: 'id'
    }
  },
  contentId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  episodeId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  watchedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  watchDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalDuration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  progressPercentage: {
    type: DataTypes.DECIMAL(5,2),
    defaultValue: 0.00
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deviceType: {
    type: DataTypes.ENUM('web', 'mobile', 'tv', 'tablet'),
    allowNull: true
  }
}, {
  tableName: 'watch_history',
  timestamps: true
});

// Define associations
UserProfile.hasMany(WatchHistory, { foreignKey: 'profileId', as: 'watchHistory' });
WatchHistory.belongsTo(UserProfile, { foreignKey: 'profileId', as: 'profile' });

module.exports = WatchHistory;
