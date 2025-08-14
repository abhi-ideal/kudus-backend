
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  profileName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 50],
      notEmpty: true
    }
  },
  isChild: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  avatarUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  preferences: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'user_profiles',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'profileName'],
      name: 'unique_profile_name_per_user'
    }
  ]
});

// Define associations
UserProfile.associate = function(models) {
  UserProfile.belongsTo(models.User, {
    foreignKey: 'userId',
    as: 'user'
  });
};

module.exports = UserProfile;
