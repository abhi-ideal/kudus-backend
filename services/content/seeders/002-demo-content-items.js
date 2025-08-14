
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('content_items', [
      {
        id: uuidv4(),
        name: 'Drama Delights',
        slug: 'drama-delights',
        description: 'Compelling drama series and movies that touch the heart',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Sparks Your Digital Superstars',
        slug: 'sparks-your-digital-superstars',
        description: 'Content featuring popular digital influencers and creators',
        displayOrder: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Documentary Shows',
        slug: 'documentary-shows',
        description: 'Educational and informative documentary content',
        displayOrder: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Action Adventures',
        slug: 'action-adventures',
        description: 'High-octane action and adventure content',
        displayOrder: 4,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Comedy Classics',
        slug: 'comedy-classics',
        description: 'Hilarious comedy series and movies',
        displayOrder: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Thriller Zone',
        slug: 'thriller-zone',
        description: 'Suspenseful thrillers that keep you on the edge',
        displayOrder: 6,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('content_items', null, {});
  }
};
