
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Episode = sequelize.define('Episode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  seasonId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'seasons',
      key: 'id'
    }
  },
  seriesId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'content',
      key: 'id'
    }
  },
  episodeNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in minutes'
  },
  thumbnailUrl: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      thumbnail: null,
      medium: null,
      hd: null,
      original: null
    }
  },
  videoUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  s3Key: {
    type: DataTypes.STRING,
    allowNull: true
  },
  videoQualities: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Available video qualities and their URLs'
  },
  airDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3,2),
    defaultValue: 0.00
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('draft', 'processing', 'published', 'archived'),
    defaultValue: 'draft'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'episodes',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['seasonId', 'episodeNumber']
    }
  ]
});

// Define associations
Episode.associate = (models) => {
  Episode.belongsTo(models.Season, {
    foreignKey: 'seasonId',
    as: 'season'
  });
  Episode.belongsTo(models.Content, {
    foreignKey: 'seriesId',
    as: 'series'
  });
  if (models.WatchHistory) {
    Episode.hasMany(models.WatchHistory, {
      foreignKey: 'episodeId',
      as: 'watchHistory'
    });
  }
};

module.exports = Episode;
