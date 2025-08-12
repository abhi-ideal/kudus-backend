
const { DataTypes } = require('sequelize');
const sequelize = require('../../../shared/config/database');

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
    type: DataTypes.TEXT
  },
  type: {
    type: DataTypes.ENUM('movie', 'series', 'episode'),
    allowNull: false
  },
  genre: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  releaseDate: {
    type: DataTypes.DATE
  },
  duration: {
    type: DataTypes.INTEGER,
    comment: 'Duration in minutes'
  },
  rating: {
    type: DataTypes.ENUM('G', 'PG', 'PG-13', 'R', 'NC-17'),
    defaultValue: 'PG'
  },
  cast: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  director: {
    type: DataTypes.STRING
  },
  poster: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  thumbnail: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  trailerUrl: {
    type: DataTypes.STRING,
    validate: {
      isUrl: true
    }
  },
  s3Key: {
    type: DataTypes.STRING,
    comment: 'S3 object key for the video file'
  },
  videoQualities: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: 'Available video qualities and their S3 keys'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  averageRating: {
    type: DataTypes.DECIMAL(2, 1),
    defaultValue: 0.0
  }
}, {
  timestamps: true,
  tableName: 'content'
});

module.exports = Content;
