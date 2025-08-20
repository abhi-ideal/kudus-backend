
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
    defaultValue: []
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  releaseYear: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rating: {
    type: DataTypes.ENUM('G', 'PG', 'PG-13', 'R', 'NC-17', 'U', '12A', '15', '18'),
    defaultValue: 'PG'
  },
  ageRating: {
    type: DataTypes.STRING,
    defaultValue: 'PG'
  },
  language: {
    type: DataTypes.STRING,
    defaultValue: 'English'
  },
  subtitles: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  characters: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  thumbnailUrl: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      "150x150": null,
      "300x300": null,
      "500x500": null,
      "800x800": null,
      "1080x1080": null
    }
  },
  posterImages: {
    type: DataTypes.JSON,
    defaultValue: {
      thumbnail: null,
      medium: null,
      hd: null,
      original: null
    }
  },
  itemId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'content_items',
      key: 'id'
    }
  },
  trailerUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  videoUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  s3Key: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'processing', 'published', 'archived'),
    defaultValue: 'draft'
  },
  availableCountries: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'List of country codes where content is available. Empty array means available globally'
  },
  restrictedCountries: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'List of country codes where content is restricted'
  },
  isGloballyAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'If true, content is available globally unless restricted'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'content',
  timestamps: true
});

// Define associations
Content.associate = (models) => {
  if (models.ContentItem) {
    Content.belongsTo(models.ContentItem, {
      foreignKey: 'itemId',
      as: 'item'
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
};

module.exports = Content;
