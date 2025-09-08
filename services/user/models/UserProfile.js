// Reference to shared UserProfile model from auth service
const UserProfile = require('../../auth/models/UserProfile');
const { DataTypes } = require('sequelize');

UserProfile.init({
  // ... other fields
  maturityLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 18,
    validate: {
      min: 0,
      max: 18
    }
  },
  isOwner: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    comment: 'Indicates if this profile is the account owner profile'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  // ... other options
});

module.exports = UserProfile;