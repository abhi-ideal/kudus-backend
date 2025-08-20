'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('content_items', [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Sparks Your Digital Superstars',
        slug: 'sparks-your-digital-superstars',
        description: 'Digital entertainment that sparks your imagination',
        displayOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'Mystery & Thriller Collection',
        slug: 'mystery-thriller-collection',
        description: 'Edge-of-your-seat mysteries and thrilling adventures',
        displayOrder: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Trending Now',
        slug: 'trending-now',
        description: 'The hottest content everyone is watching right now',
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