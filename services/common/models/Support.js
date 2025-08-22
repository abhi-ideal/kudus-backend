
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Support = sequelize.define('Support', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 200]
    }
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 2000]
    }
  },
  category: {
    type: DataTypes.ENUM('general', 'technical', 'billing', 'account', 'content', 'other'),
    defaultValue: 'general'
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  adminResponse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'Support',
  timestamps: true,
  indexes: [
    { fields: ['status'] },
    { fields: ['category'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = Support;
