
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentItem = sequelize.define('ContentItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'content_items',
  timestamps: true
});

// Define associations
ContentItem.associate = (models) => {
  // Has many content item mappings
  if (models.ContentItemMapping) {
    ContentItem.hasMany(models.ContentItemMapping, {
      foreignKey: 'itemId',
      as: 'itemMappings'
    });
  }
};

module.exports = ContentItem;
