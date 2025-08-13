
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const genres = [
      {
        id: uuidv4(),
        name: 'Action',
        slug: 'action',
        description: 'High-energy films with exciting sequences and stunts',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Comedy',
        slug: 'comedy',
        description: 'Light-hearted films designed to amuse and entertain',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Drama',
        slug: 'drama',
        description: 'Serious narratives focusing on character development',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Horror',
        slug: 'horror',
        description: 'Films intended to frighten, unsettle, or create suspense',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Romance',
        slug: 'romance',
        description: 'Stories centered around love and relationships',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Sci-Fi',
        slug: 'sci-fi',
        description: 'Science fiction films with futuristic concepts',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Thriller',
        slug: 'thriller',
        description: 'Suspenseful films that keep viewers on edge',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Documentary',
        slug: 'documentary',
        description: 'Non-fiction films documenting reality',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('genres', genres);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('genres', null, {});
  }
};
