
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentLike = sequelize.define('ContentLike', {
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
    allowNull: false,
    comment: 'References content.id from content service'
  },
  isLiked: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'True for like, false for dislike'
  }
}, {
  tableName: 'content_likes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'profileId', 'contentId'],
      name: 'unique_user_profile_content_like'
    },
    {
      fields: ['contentId', 'isLiked'],
      name: 'idx_content_likes_content_liked'
    },
    {
      fields: ['userId', 'profileId'],
      name: 'idx_content_likes_user_profile'
    }
  ]
});

ContentLike.associate = function(models) {
  ContentLike.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
  ContentLike.belongsTo(models.UserProfile, {
    foreignKey: 'profileId',
    as: 'profile'
  });
};

module.exports = ContentLike;
