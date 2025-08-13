
'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const userId1 = uuidv4();
    const userId2 = uuidv4();
    const contentId1 = uuidv4();
    const contentId2 = uuidv4();
    const contentId3 = uuidv4();
    
    // Add user preferences
    await queryInterface.bulkInsert('user_preferences', [
      {
        id: uuidv4(),
        userId: userId1,
        preferredGenres: JSON.stringify(['Action', 'Adventure', 'Sci-Fi']),
        dislikedGenres: JSON.stringify(['Horror']),
        preferredLanguages: JSON.stringify(['English', 'Spanish']),
        watchTimePatterns: JSON.stringify({
          peak_hours: ['19:00-23:00'],
          weekend_preference: true,
          average_session_duration: 120
        }),
        contentTypePreferences: JSON.stringify({
          movies: 0.7,
          series: 0.3
        }),
        ratingHistory: JSON.stringify([
          { contentId: contentId1, rating: 5, date: '2023-01-15' },
          { contentId: contentId2, rating: 4, date: '2023-01-20' }
        ]),
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: userId2,
        preferredGenres: JSON.stringify(['Mystery', 'Thriller', 'Drama']),
        dislikedGenres: JSON.stringify(['Comedy']),
        preferredLanguages: JSON.stringify(['English']),
        watchTimePatterns: JSON.stringify({
          peak_hours: ['20:00-22:00'],
          weekend_preference: false,
          average_session_duration: 45
        }),
        contentTypePreferences: JSON.stringify({
          movies: 0.4,
          series: 0.6
        }),
        ratingHistory: JSON.stringify([
          { contentId: contentId2, rating: 5, date: '2023-01-18' },
          { contentId: contentId3, rating: 3, date: '2023-01-25' }
        ]),
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Add recommendations
    await queryInterface.bulkInsert('recommendations', [
      {
        id: uuidv4(),
        userId: userId1,
        contentId: contentId1,
        score: 0.95,
        reason: 'Based on your love for action movies',
        recommendationType: 'personalized',
        isViewed: true,
        viewedAt: new Date(),
        isClicked: true,
        clickedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: userId1,
        contentId: contentId2,
        score: 0.87,
        reason: 'Trending in your area',
        recommendationType: 'trending',
        isViewed: false,
        isClicked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: userId2,
        contentId: contentId2,
        score: 0.92,
        reason: 'Because you watched similar mysteries',
        recommendationType: 'similar',
        isViewed: true,
        viewedAt: new Date(),
        isClicked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        userId: userId2,
        contentId: contentId3,
        score: 0.78,
        reason: 'Users like you also enjoyed this',
        recommendationType: 'collaborative',
        isViewed: false,
        isClicked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Add content similarity data
    await queryInterface.bulkInsert('content_similarity', [
      {
        id: uuidv4(),
        contentId1: contentId1,
        contentId2: contentId2,
        similarityScore: 0.75,
        similarityType: 'genre',
        calculatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        contentId1: contentId2,
        contentId2: contentId3,
        similarityScore: 0.82,
        similarityType: 'user_behavior',
        calculatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        contentId1: contentId1,
        contentId2: contentId3,
        similarityScore: 0.65,
        similarityType: 'cast',
        calculatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('content_similarity', null, {});
    await queryInterface.bulkDelete('recommendations', null, {});
    await queryInterface.bulkDelete('user_preferences', null, {});
  }
};
