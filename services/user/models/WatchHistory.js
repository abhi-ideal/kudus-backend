
const { DataTypes } = require('sequelize');
const sequelize = require('../../../shared/config/database');

const WatchHistory = sequelize.define('WatchHistory', {
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
  contentId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  watchedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  position: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Current playback position in seconds'
  },
  duration: {
    type: DataTypes.INTEGER,
    comment: 'Total duration in seconds'
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  tableName: 'watch_history'
});

module.exports = WatchHistory;
