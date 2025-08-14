
const UserProfile = require('../models/UserProfile');
const { Op } = require('sequelize');

class ProfileService {
  /**
   * Create a new profile for a user
   */
  async createProfile(userIdOrFirebaseUid, profileData) {
    const { profileName, isChild = false, avatarUrl, preferences = {} } = profileData;
    
    // If userIdOrFirebaseUid looks like Firebase UID, find the actual user ID
    let userId = userIdOrFirebaseUid;
    if (typeof userIdOrFirebaseUid === 'string' && userIdOrFirebaseUid.length > 20) {
      const User = require('../models/User');
      const user = await User.findOne({ where: { firebaseUid: userIdOrFirebaseUid } });
      if (user) {
        userId = user.id;
      } else {
        throw new Error('User not found');
      }
    }

    // Check if user already has 5 profiles (Netflix-style limit)
    const existingProfiles = await UserProfile.count({
      where: { userId, isActive: true }
    });

    if (existingProfiles >= 5) {
      throw new Error('Maximum number of profiles (5) reached');
    }

    // Check if profile name already exists for this user
    const existingProfile = await UserProfile.findOne({
      where: { 
        userId, 
        profileName: profileName.trim(),
        isActive: true 
      }
    });

    if (existingProfile) {
      throw new Error('Profile name already exists');
    }

    const profile = await UserProfile.create({
      userId,
      profileName: profileName.trim(),
      isChild,
      avatarUrl,
      preferences
    });

    return profile;
  }

  /**
   * Get all profiles for a user
   */
  async getUserProfiles(userId) {
    const profiles = await UserProfile.findAll({
      where: { 
        userId,
        isActive: true 
      },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'profileName', 'isChild', 'avatarUrl', 'preferences', 'createdAt']
    });

    return profiles;
  }

  /**
   * Get a specific profile by ID and user ID
   */
  async getProfileById(profileId, userId) {
    const profile = await UserProfile.findOne({
      where: { 
        id: profileId,
        userId,
        isActive: true 
      },
      attributes: ['id', 'profileName', 'isChild', 'avatarUrl', 'preferences', 'createdAt']
    });

    return profile;
  }

  /**
   * Update a profile
   */
  async updateProfile(profileId, userId, updateData) {
    const { profileName, isChild, avatarUrl, preferences } = updateData;

    const profile = await UserProfile.findOne({
      where: { 
        id: profileId,
        userId,
        isActive: true 
      }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Check if new profile name conflicts with existing ones
    if (profileName && profileName.trim() !== profile.profileName) {
      const existingProfile = await UserProfile.findOne({
        where: { 
          userId, 
          profileName: profileName.trim(),
          isActive: true,
          id: { [Op.ne]: profileId }
        }
      });

      if (existingProfile) {
        throw new Error('Profile name already exists');
      }
    }

    const updateFields = {};
    if (profileName) updateFields.profileName = profileName.trim();
    if (typeof isChild === 'boolean') updateFields.isChild = isChild;
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;
    if (preferences) updateFields.preferences = preferences;

    await profile.update(updateFields);
    return profile;
  }

  /**
   * Delete a profile (soft delete)
   */
  async deleteProfile(profileId, userId) {
    const profile = await UserProfile.findOne({
      where: { 
        id: profileId,
        userId,
        isActive: true 
      }
    });

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Check if this is the last active profile
    const activeProfilesCount = await UserProfile.count({
      where: { userId, isActive: true }
    });

    if (activeProfilesCount <= 1) {
      throw new Error('Cannot delete the last profile');
    }

    await profile.update({ isActive: false });
    return { message: 'Profile deleted successfully' };
  }

  /**
   * Validate if profile belongs to user (for JWT token validation)
   */
  async validateProfileOwnership(profileId, userProfileIds) {
    return userProfileIds.includes(profileId);
  }

  /**
   * Get user's profile IDs for JWT token
   */
  async getUserProfileIds(userId) {
    const profiles = await UserProfile.findAll({
      where: { 
        userId,
        isActive: true 
      },
      attributes: ['id']
    });

    return profiles.map(profile => profile.id);
  }
}

module.exports = new ProfileService();
