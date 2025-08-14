
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get some existing content and profile IDs for demo data
    const contents = await queryInterface.sequelize.query(
      'SELECT id FROM content WHERE isActive = true LIMIT 5',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (contents.length === 0) {
      console.log('No content found for watchlist seeding');
      return;
    }

    // Create demo watchlist entries
    const watchlistEntries = [];
    const profileIds = [
      uuidv4(), // Demo profile IDs
      uuidv4(),
      uuidv4()
    ];

    profileIds.forEach(profileId => {
      // Add 2-3 random contents to each profile's watchlist
      const numItems = Math.floor(Math.random() * 3) + 2;
      const selectedContents = contents.slice(0, numItems);
      
      selectedContents.forEach(content => {
        watchlistEntries.push({
          id: uuidv4(),
          profileId: profileId,
          contentId: content.id,
          addedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    });

    await queryInterface.bulkInsert('watchlist', watchlistEntries);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('watchlist', null, {});
  }
};
