
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentItem = sequelize.define('ContentItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
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
  if (models.Content && models.ContentItemMapping) {
    ContentItem.belongsToMany(models.Content, {
      through: models.ContentItemMapping,
      foreignKey: 'itemId',
      otherKey: 'contentId',
      as: 'content'
    });
  }
  
  // Direct association with ContentItemMapping
  if (models.ContentItemMapping) {
    ContentItem.hasMany(models.ContentItemMapping, {
      foreignKey: 'itemId',
      as: 'itemMappings'
    });
  }
};

module.exports = ContentItem;
