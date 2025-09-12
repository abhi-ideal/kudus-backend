
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('movie', 'series', 'documentary', 'short'),
    allowNull: false
  },
  genre: {
    type: DataTypes.JSON,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in minutes'
  },
  releaseYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    validate: {
      min: 0,
      max: 10
    }
  },
  ageRating: {
    type: DataTypes.ENUM('G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14', 'TV-MA'),
    allowNull: true
  },
  language: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subtitles: {
    type: DataTypes.JSON,
    allowNull: true
  },
  cast: {
    type: DataTypes.JSON,
    allowNull: true
  },
  director: {
    type: DataTypes.STRING,
    allowNull: true
  },
  producer: {
    type: DataTypes.STRING,
    allowNull: true
  },
  studio: {
    type: DataTypes.STRING,
    allowNull: true
  },
  thumbnailUrl: {
    type: DataTypes.JSON,
    allowNull: true
  },
  posterImages: {
    type: DataTypes.JSON,
    allowNull: true
  },
  trailerUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  streamingUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  downloadUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  s3Key: {
    type: DataTypes.STRING,
    allowNull: true
  },
  videoQualities: {
    type: DataTypes.JSON,
    allowNull: true
  },
  availableCountries: {
    type: DataTypes.JSON,
    allowNull: true
  },
  restrictedCountries: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isGloballyAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  featuredAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  showOnChildProfile: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  characters: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'content',
  timestamps: true
});

// Define associations
Content.associate = (models) => {
  // Direct association with ContentItemMapping
  if (models.ContentItemMapping) {
    Content.hasMany(models.ContentItemMapping, {
      foreignKey: 'contentId',
      as: 'contentMappings'
    });
  }
  
  // Series associations
  if (models.Season) {
    Content.hasMany(models.Season, {
      foreignKey: 'seriesId',
      as: 'seasons'
    });
  }
  
  if (models.Episode) {
    Content.hasMany(models.Episode, {
      foreignKey: 'seriesId',
      as: 'episodes'
    });
  }

  // Watchlist association
  if (models.Watchlist) {
    Content.hasMany(models.Watchlist, {
      foreignKey: 'contentId',
      as: 'watchlistEntries'
    });
  }

  // Watch history association
  if (models.WatchHistory) {
    Content.hasMany(models.WatchHistory, {
      foreignKey: 'contentId',
      as: 'watchHistory'
    });
  }

  // Content likes association
  if (models.ContentLike) {
    Content.hasMany(models.ContentLike, {
      foreignKey: 'contentId',
      as: 'likes'
    });
  }
};

module.exports = Content;
