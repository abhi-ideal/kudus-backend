
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const movieId = uuidv4();
    const seriesId = uuidv4();
    
    await queryInterface.bulkInsert('content', [
      {
        id: movieId,
        title: 'The Adventure Begins',
        description: 'An epic adventure movie about courage and friendship.',
        type: 'movie',
        genre: JSON.stringify(['Action', 'Adventure']),
        duration: 120,
        releaseYear: 2023,
        rating: 4.2,
        ageRating: 'PG-13',
        language: 'English',
        subtitles: JSON.stringify(['English', 'Spanish']),
        cast: JSON.stringify(['John Doe', 'Jane Smith', 'Bob Johnson']),
        director: 'Famous Director',
        thumbnailUrl: 'https://example.com/thumbnails/adventure-begins.jpg',
        trailerUrl: 'https://example.com/trailers/adventure-begins.mp4',
        status: 'published',
        isActive: true,
        views: 15420,
        likes: 1205,
        averageRating: 4.2,
        totalRatings: 3420,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: seriesId,
        title: 'Mystery of the Lost City',
        description: 'A thrilling mystery series that will keep you on the edge of your seat.',
        type: 'series',
        genre: JSON.stringify(['Mystery', 'Thriller']),
        duration: 45,
        releaseYear: 2023,
        rating: 4.7,
        ageRating: 'PG-13',
        language: 'English',
        subtitles: JSON.stringify(['English', 'Spanish', 'French']),
        cast: JSON.stringify(['Alice Cooper', 'David Wilson', 'Emma Brown']),
        director: 'Mystery Master',
        thumbnailUrl: 'https://example.com/thumbnails/lost-city.jpg',
        trailerUrl: 'https://example.com/trailers/lost-city.mp4',
        status: 'published',
        isActive: true,
        views: 28350,
        likes: 2840,
        averageRating: 4.7,
        totalRatings: 5420,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Nature Documentary',
        description: 'Explore the wonders of our natural world.',
        type: 'documentary',
        genre: JSON.stringify(['Documentary', 'Nature']),
        duration: 90,
        releaseYear: 2023,
        rating: 4.5,
        ageRating: 'G',
        language: 'English',
        subtitles: JSON.stringify(['English']),
        cast: JSON.stringify(['Narrator']),
        director: 'Nature Filmmaker',
        thumbnailUrl: 'https://example.com/thumbnails/nature-doc.jpg',
        status: 'published',
        isActive: true,
        views: 8420,
        likes: 720,
        averageRating: 4.5,
        totalRatings: 1420,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Add episodes for the series
    await queryInterface.bulkInsert('content_episodes', [
      {
        id: uuidv4(),
        seriesId: seriesId,
        seasonNumber: 1,
        episodeNumber: 1,
        title: 'The Beginning',
        description: 'The mystery unfolds as our heroes discover the first clue.',
        duration: 45,
        airDate: new Date('2023-01-15'),
        thumbnailUrl: 'https://example.com/episodes/s1e1.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        seriesId: seriesId,
        seasonNumber: 1,
        episodeNumber: 2,
        title: 'The Hunt Continues',
        description: 'Our heroes follow the trail deeper into the mystery.',
        duration: 47,
        airDate: new Date('2023-01-22'),
        thumbnailUrl: 'https://example.com/episodes/s1e2.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        seriesId: seriesId,
        seasonNumber: 1,
        episodeNumber: 3,
        title: 'Revelations',
        description: 'Shocking revelations change everything.',
        duration: 44,
        airDate: new Date('2023-01-29'),
        thumbnailUrl: 'https://example.com/episodes/s1e3.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('content_episodes', null, {});
    await queryInterface.bulkDelete('content', null, {});
  }
};
