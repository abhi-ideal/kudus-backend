
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TermsConditions = sequelize.define('TermsConditions', {
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
  tableName: 'TermsConditions',
  timestamps: true,
  indexes: [
    { fields: ['isActive'] },
    { fields: ['effectiveDate'] }
  ],
  hooks: {
    beforeCreate: async (terms) => {
      if (terms.isActive) {
        // Deactivate all existing terms before creating a new active one
        await TermsConditions.update({ isActive: false }, { where: { isActive: true } });
      }
    },
    beforeUpdate: async (terms) => {
      if (terms.isActive && terms.changed('isActive')) {
        // Deactivate all other terms when activating this one
        await TermsConditions.update({ isActive: false }, { where: { isActive: true, id: { [require('sequelize').Op.ne]: terms.id } } });
      }
    }
  }
});

module.exports = TermsConditions;
