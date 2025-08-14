
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserFeed = sequelize.define('UserFeed', {
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
  profileId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'user_profiles',
      key: 'id'
    }
  },
  contentId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  feedType: {
    type: DataTypes.ENUM('trending', 'recommended', 'new_release', 'continue_watching', 'watchlist'),
    allowNull: false
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  isViewed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  viewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'user_feeds',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'profileId', 'feedType']
    },
    {
      fields: ['priority', 'createdAt']
    }
  ]
});

UserFeed.associate = function(models) {
  UserFeed.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  UserFeed.belongsTo(models.UserProfile, {
    foreignKey: 'profileId',
    as: 'profile'
  });
};

module.exports = UserFeed;
