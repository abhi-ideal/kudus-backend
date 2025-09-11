
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentItemMapping = sequelize.define('ContentItemMapping', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  contentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'content',
      key: 'id'
    }
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'content_items',
      key: 'id'
    }
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Order of content within the item'
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Whether this content is featured in the item'
  }
}, {
  tableName: 'content_item_mappings',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['contentId', 'itemId']
    }
  ]
});

// Define associations
ContentItemMapping.associate = (models) => {
  // Belongs to Content
  if (models.Content) {
    ContentItemMapping.belongsTo(models.Content, {
      foreignKey: 'contentId',
      as: 'content'
    });
  }

  // Belongs to ContentItem
  if (models.ContentItem) {
    ContentItemMapping.belongsTo(models.ContentItem, {
      foreignKey: 'itemId',
      as: 'item'
    });
  }
};

module.exports = ContentItemMapping;
