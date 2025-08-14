
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Season = sequelize.define('Season', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  seriesId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'content',
      key: 'id'
    }
  },
  seasonNumber: {
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
  posterImages: {
    type: DataTypes.JSON,
    defaultValue: {
      thumbnail: null,
      medium: null,
      hd: null,
      original: null
    }
  },
  releaseDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  totalEpisodes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('upcoming', 'airing', 'completed', 'cancelled'),
    defaultValue: 'upcoming'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'seasons',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['seriesId', 'seasonNumber']
    }
  ]
});

// Define associations
Season.associate = (models) => {
  Season.belongsTo(models.Content, {
    foreignKey: 'seriesId',
    as: 'series'
  });
  Season.hasMany(models.Episode, {
    foreignKey: 'seasonId',
    as: 'episodes'
  });
};

module.exports = Season;
