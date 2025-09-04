
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HelpArticle = sequelize.define('HelpArticle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 200]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [20, 10000]
    }
  },
  category: {
    type: DataTypes.ENUM('account', 'billing', 'streaming', 'features', 'content', 'general'),
    defaultValue: 'general'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isFAQ: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  updatedBy: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'HelpArticles',
  timestamps: true,
  indexes: [
    { fields: ['category'] },
    { fields: ['isPublished'] },
    { fields: ['isFAQ'] },
    { fields: ['order'] }
  ]
});

module.exports = HelpArticle;
