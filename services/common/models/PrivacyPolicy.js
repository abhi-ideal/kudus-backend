
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PrivacyPolicy = sequelize.define('PrivacyPolicy', {
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
      notEmpty: true
    }
  },
  version: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  effectiveDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'PrivacyPolicy',
  timestamps: true,
  indexes: [
    { fields: ['isActive'] },
    { fields: ['effectiveDate'] }
  ],
  hooks: {
    beforeCreate: async (policy) => {
      if (policy.isActive) {
        // Deactivate all existing policies before creating a new active one
        await PrivacyPolicy.update({ isActive: false }, { where: { isActive: true } });
      }
    },
    beforeUpdate: async (policy) => {
      if (policy.isActive && policy.changed('isActive')) {
        // Deactivate all other policies when activating this one
        await PrivacyPolicy.update({ isActive: false }, { where: { isActive: true, id: { [require('sequelize').Op.ne]: policy.id } } });
      }
    }
  }
});

module.exports = PrivacyPolicy;
