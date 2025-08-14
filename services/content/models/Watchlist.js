
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Watchlist = sequelize.define('Watchlist', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  profileId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  contentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'content',
      key: 'id'
    }
  },
  addedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'watchlist',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['profileId', 'contentId']
    }
  ]
});

// Define associations
Watchlist.associate = (models) => {
  Watchlist.belongsTo(models.Content, {
    foreignKey: 'contentId',
    as: 'content'
  });
};

module.exports = Watchlist;
