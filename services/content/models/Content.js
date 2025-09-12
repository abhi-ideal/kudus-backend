
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
      "banner": null,      // 16:4 ratio (1920x480px)
      "landscape": null,   // 16:9 ratio (1200x675px)
      "portrait": null,    // 2:3 ratio (500x750px)
      "square": null       // 1:1 ratio (500x500px)
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
  featuredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When this content was featured. Null means unfeatured, date means featured'
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
  if (models.ContentItem && models.ContentItemMapping) {
    Content.belongsToMany(models.ContentItem, {
      through: models.ContentItemMapping,
      foreignKey: 'contentId',
      otherKey: 'itemId',
      as: 'items'
    });
  }
  
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
      as: 'contentLikes'
    });
  }
};

module.exports = Content;
