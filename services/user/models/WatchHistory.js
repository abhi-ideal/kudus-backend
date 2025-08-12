
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
  watchedDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  totalDuration: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  watchedPercentage: {
    type: DataTypes.DECIMAL(5,2),
    defaultValue: 0.00
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lastWatchedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'watch_history',
  timestamps: true
});

module.exports = WatchHistory;
