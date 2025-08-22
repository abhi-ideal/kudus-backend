
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get some existing content and profiles for demo data
    const profiles = await queryInterface.sequelize.query(
      'SELECT id FROM user_profiles LIMIT 3',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const content = await queryInterface.sequelize.query(
      'SELECT id, type, duration FROM content WHERE isActive = true LIMIT 5',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const episodes = await queryInterface.sequelize.query(
      'SELECT id, seriesId, duration FROM episodes WHERE isActive = true LIMIT 3',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (profiles.length === 0 || content.length === 0) {
      console.log('No profiles or content found, skipping watch history seeding');
      return;
    }

    const watchHistoryData = [];

    // Create incomplete movie watch history
    if (content.length > 0 && profiles.length > 0) {
      const movie = content.find(c => c.type === 'movie') || content[0];
      const profile = profiles[0];
      
      watchHistoryData.push({
        id: uuidv4(),
        profileId: profile.id,
        contentId: movie.id,
        episodeId: null,
        watchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        watchDuration: Math.floor(movie.duration * 0.6), // 60% watched
        totalDuration: movie.duration,
        progressPercentage: 60.0,
        isCompleted: false,
        deviceType: 'web',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create incomplete series episode watch history
    if (episodes.length > 0 && profiles.length > 0) {
      const episode = episodes[0];
      const profile = profiles[0];
      
      watchHistoryData.push({
        id: uuidv4(),
        profileId: profile.id,
        contentId: episode.seriesId,
        episodeId: episode.id,
        watchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        watchDuration: Math.floor(episode.duration * 0.4), // 40% watched
        totalDuration: episode.duration,
        progressPercentage: 40.0,
        isCompleted: false,
        deviceType: 'mobile',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create completed content (should not appear in continue watching)
    if (content.length > 1 && profiles.length > 0) {
      const completedContent = content[1];
      const profile = profiles[0];
      
      watchHistoryData.push({
        id: uuidv4(),
        profileId: profile.id,
        contentId: completedContent.id,
        episodeId: null,
        watchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        watchDuration: completedContent.duration,
        totalDuration: completedContent.duration,
        progressPercentage: 100.0,
        isCompleted: true,
        deviceType: 'tv',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create watch history for second profile
    if (content.length > 2 && profiles.length > 1) {
      const secondProfile = profiles[1];
      const secondContent = content[2];
      
      watchHistoryData.push({
        id: uuidv4(),
        profileId: secondProfile.id,
        contentId: secondContent.id,
        episodeId: null,
        watchedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        watchDuration: Math.floor(secondContent.duration * 0.75), // 75% watched
        totalDuration: secondContent.duration,
        progressPercentage: 75.0,
        isCompleted: false,
        deviceType: 'tablet',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Create multiple incomplete episodes for series binge watching
    if (episodes.length > 1 && profiles.length > 0) {
      const profile = profiles[0];
      
      for (let i = 1; i < Math.min(episodes.length, 3); i++) {
        const episode = episodes[i];
        watchHistoryData.push({
          id: uuidv4(),
          profileId: profile.id,
          contentId: episode.seriesId,
          episodeId: episode.id,
          watchedAt: new Date(Date.now() - (i * 3 * 60 * 60 * 1000)), // Staggered times
          watchDuration: Math.floor(episode.duration * (0.3 + (i * 0.2))), // Different progress levels
          totalDuration: episode.duration,
          progressPercentage: 30.0 + (i * 20.0),
          isCompleted: false,
          deviceType: 'web',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (watchHistoryData.length > 0) {
      await queryInterface.bulkInsert('watch_history', watchHistoryData);
      console.log(`✅ Inserted ${watchHistoryData.length} watch history records for continue watching demo`);
    } else {
      console.log('⚠️ No watch history data created - insufficient profiles or content');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('watch_history', null, {});
  }
};
