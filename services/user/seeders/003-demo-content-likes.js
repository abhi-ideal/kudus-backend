
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get existing users and profiles from the database
    const users = await queryInterface.sequelize.query(
      'SELECT id, firebaseUid FROM users LIMIT 5;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const profiles = await queryInterface.sequelize.query(
      'SELECT id, userId FROM user_profiles LIMIT 10;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0 || profiles.length === 0) {
      console.log('No users or profiles found for content likes seeder');
      return;
    }

    // Demo content IDs (these would normally come from the content service)
    const demoContentIds = [
      uuidv4(), // Demo Movie 1
      uuidv4(), // Demo Movie 2
      uuidv4(), // Demo Series 1
      uuidv4(), // Demo Documentary 1
      uuidv4(), // Demo Movie 3
    ];

    const contentLikes = [];

    // Create some likes and dislikes for different users and profiles
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const userProfiles = profiles.filter(p => p.userId === user.id);

      // Create likes for user's profiles
      for (let j = 0; j < userProfiles.length && j < 3; j++) {
        const profile = userProfiles[j];
        
        // Each profile likes 2-3 pieces of content
        for (let k = 0; k < Math.min(3, demoContentIds.length); k++) {
          if (Math.random() > 0.3) { // 70% chance to like
            contentLikes.push({
              id: uuidv4(),
              userId: user.id,
              profileId: profile.id,
              contentId: demoContentIds[k],
              isLiked: Math.random() > 0.2, // 80% likes, 20% dislikes
              createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
              updatedAt: new Date()
            });
          }
        }
      }

      // Also create some user-level likes (without specific profile)
      for (let k = 0; k < 2 && k < demoContentIds.length; k++) {
        if (Math.random() > 0.5) { // 50% chance
          contentLikes.push({
            id: uuidv4(),
            userId: user.id,
            profileId: null,
            contentId: demoContentIds[k + 2], // Different content
            isLiked: Math.random() > 0.15, // 85% likes, 15% dislikes
            createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Random date in last 60 days
            updatedAt: new Date()
          });
        }
      }
    }

    if (contentLikes.length > 0) {
      await queryInterface.bulkInsert('content_likes', contentLikes);
      console.log(`Created ${contentLikes.length} demo content likes`);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('content_likes', null, {});
  }
};
