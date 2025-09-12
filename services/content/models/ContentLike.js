const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentLike = sequelize.define('ContentLike', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'user_profiles',
      key: 'id'
    }
  },
  contentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'content',
      key: 'id'
    }
  },
  likedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'content_likes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['profileId', 'contentId']
    },
    {
      fields: ['contentId']
    },
    {
      fields: ['profileId']
    }
  ]
});

// Define associations
ContentLike.associate = (models) => {
  // User association
  if (models.User) {
    ContentLike.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'likeUser'
    });
  }

  // User profile association
  if (models.UserProfile) {
    ContentLike.belongsTo(models.UserProfile, {
      foreignKey: 'profileId',
      as: 'likeProfile'
    });
  }

  // Content association
  if (models.Content) {
    ContentLike.belongsTo(models.Content, {
      foreignKey: 'contentId',
      as: 'likedContent'
    });
  }
};

module.exports = ContentLike;