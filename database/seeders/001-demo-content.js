
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const contentData = [
      {
        id: uuidv4(),
        title: 'The Adventure Begins',
        description: 'An epic adventure movie about courage and friendship.',
        type: 'movie',
        genre: JSON.stringify(['Action', 'Adventure']),
        releaseDate: new Date('2023-01-15'),
        duration: 120,
        rating: 'PG-13',
        cast: JSON.stringify(['John Doe', 'Jane Smith', 'Bob Johnson']),
        director: 'Famous Director',
        poster: 'https://example.com/posters/adventure-begins.jpg',
        thumbnail: 'https://example.com/thumbnails/adventure-begins.jpg',
        isActive: true,
        views: 15420,
        averageRating: 4.2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Mystery of the Lost City',
        description: 'A thrilling mystery series that will keep you on the edge of your seat.',
        type: 'series',
        genre: JSON.stringify(['Mystery', 'Thriller']),
        releaseDate: new Date('2023-03-10'),
        duration: 45,
        rating: 'PG-13',
        cast: JSON.stringify(['Alice Cooper', 'David Wilson', 'Emma Brown']),
        director: 'Mystery Master',
        poster: 'https://example.com/posters/lost-city.jpg',
        thumbnail: 'https://example.com/thumbnails/lost-city.jpg',
        isActive: true,
        views: 28350,
        averageRating: 4.7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Comedy Central Hour',
        description: 'Laugh out loud with this hilarious comedy special.',
        type: 'movie',
        genre: JSON.stringify(['Comedy']),
        releaseDate: new Date('2023-02-20'),
        duration: 90,
        rating: 'PG',
        cast: JSON.stringify(['Funny Comedian', 'Supporting Actor']),
        director: 'Comedy Director',
        poster: 'https://example.com/posters/comedy-hour.jpg',
        thumbnail: 'https://example.com/thumbnails/comedy-hour.jpg',
        isActive: true,
        views: 12850,
        averageRating: 3.9,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('content', contentData, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('content', null, {});
  }
};
