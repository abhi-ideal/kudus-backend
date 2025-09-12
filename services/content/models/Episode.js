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
      "banner": null,      // 16:4 ratio (1920x480px)
      "landscape": null,   // 16:9 ratio (1200x675px)
      "portrait": null,    // 2:3 ratio (500x750px)
      "square": null       // 1:1 ratio (500x500px)
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
  // Series (Content) association
  if (models.Content) {
    Episode.belongsTo(models.Content, {
      foreignKey: 'seriesId',
      as: 'series'
    });
  }

  // Season association
  if (models.Season) {
    Episode.belongsTo(models.Season, {
      foreignKey: 'seasonId',
      as: 'episodeSeason'
    });
  }

  // Watch history association
  if (models.WatchHistory) {
    Episode.hasMany(models.WatchHistory, {
      foreignKey: 'episodeId',
      as: 'episodeWatchHistory'
    });
  }
};

module.exports = Episode;