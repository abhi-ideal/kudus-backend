
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get existing users
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users LIMIT 2',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log('No users found, skipping profile seeding');
      return;
    }

    const userId1 = users[0].id;
    const userId2 = users.length > 1 ? users[1].id : userId1;

    await queryInterface.bulkInsert('user_profiles', [
      {
        id: uuidv4(),
        userId: userId1,
        profileName: 'Main Profile',
        isChild: false,
        avatarUrl: 'https://example.com/avatars/adult1.png',
        preferences: JSON.stringify({
          autoplay: true,
          quality: 'HD',
          subtitles: true,
          preferredGenres: ['Action', 'Drama', 'Thriller']
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: userId1,
        profileName: 'Kids',
        isChild: true,
        avatarUrl: 'https://example.com/avatars/child1.png',
        preferences: JSON.stringify({
          autoplay: false,
          quality: 'SD',
          subtitles: true,
          preferredGenres: ['Animation', 'Family', 'Adventure']
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: userId2,
        profileName: 'Personal',
        isChild: false,
        avatarUrl: 'https://example.com/avatars/adult2.png',
        preferences: JSON.stringify({
          autoplay: true,
          quality: 'FHD',
          subtitles: false,
          preferredGenres: ['Comedy', 'Romance', 'Mystery']
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: userId2,
        profileName: 'Teen',
        isChild: true,
        avatarUrl: 'https://example.com/avatars/teen1.png',
        preferences: JSON.stringify({
          autoplay: true,
          quality: 'HD',
          subtitles: true,
          preferredGenres: ['Adventure', 'Fantasy', 'Comedy']
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('user_profiles', null, {});
  }
};
