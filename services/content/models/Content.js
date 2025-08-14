
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
    type: DataTypes.TEXT,
    allowNull: true
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
  items: {
    type: DataTypes.ENUM('drama-delights', 'sparks-your-digital-superstars', 'documentary-shows', 'action-adventures', 'comedy-classics', 'thriller-zone'),
    allowNull: true
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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'content',
  timestamps: true
});

module.exports = Content;
