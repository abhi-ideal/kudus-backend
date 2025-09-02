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

    // Now, let's add more specific data for upcoming-soon and top-10-series endpoints

    // Add upcoming-soon data (Action genre, released in the future or recent past)
    const upcomingSoonData = [
      { id: uuidv4(), title: 'Action Movie 1', genre: 'Action', releaseYear: 2025, type: 'movie', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), title: 'Action Series 1', genre: 'Action', releaseYear: 2025, type: 'series', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), title: 'Action Movie 2', genre: 'Action', releaseYear: 2024, type: 'movie', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), title: 'Action Series 2', genre: 'Action', releaseYear: 2024, type: 'series', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ];
    await queryInterface.bulkInsert('content', upcomingSoonData);
    console.log('✅ Inserted demo data for upcoming-soon');

    // Add top-10-series data (Comedy genre)
    const top10SeriesData = [
      { id: uuidv4(), title: 'Comedy Series 1', genre: 'Comedy', releaseYear: 2023, type: 'series', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), title: 'Comedy Series 2', genre: 'Comedy', releaseYear: 2023, type: 'series', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), title: 'Comedy Series 3', genre: 'Comedy', releaseYear: 2022, type: 'series', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), title: 'Comedy Movie 1', genre: 'Comedy', releaseYear: 2023, type: 'movie', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), title: 'Action Series 3', genre: 'Action', releaseYear: 2025, type: 'series', isActive: true, createdAt: new Date(), updatedAt: new Date() }, // Add another action series for variety
    ];
    await queryInterface.bulkInsert('content', top10SeriesData);
    console.log('✅ Inserted demo data for top-10-series');

    // Fetch all content to use for watch history generation
    const allContentRows = await queryInterface.sequelize.query(
      'SELECT id, genre FROM content WHERE isActive = true',
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get profiles again, in case the above inserts added new ones (unlikely but safe)
    const updatedProfiles = await queryInterface.sequelize.query(
      'SELECT id FROM user_profiles LIMIT 3',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const watchHistoryDataForSeeding = [];

    // Random watch history for existing content
    for (let i = 0; i < allContentRows.length; i++) {
      const content = allContentRows[i];

      // Give comedy series more watch counts for top-10 testing
      let watchCount;
      if (content.genre && content.genre.includes('Comedy')) {
        watchCount = Math.floor(Math.random() * 50) + 30; // 30-80 watches for comedy
      } else {
        watchCount = Math.floor(Math.random() * 20) + 5; // 5-25 watches for others
      }

      for (let j = 0; j < watchCount; j++) {
        const randomProfile = updatedProfiles[Math.floor(Math.random() * updatedProfiles.length)];
        const randomProgress = Math.floor(Math.random() * 90) + 10; // 10-100% progress
        const randomWatchedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Last 30 days

        watchHistoryDataForSeeding.push({
          id: uuidv4(),
          profileId: randomProfile.id,
          contentId: content.id,
          progress: randomProgress,
          watchedAt: randomWatchedAt,
          deviceType: ['mobile', 'desktop', 'tv'][Math.floor(Math.random() * 3)],
          isCompleted: randomProgress >= 90,
          createdAt: randomWatchedAt,
          updatedAt: randomWatchedAt
        });
      }
    }

    if (watchHistoryDataForSeeding.length > 0) {
      await queryInterface.bulkInsert('watch_history', watchHistoryDataForSeeding);
      console.log(`✅ Inserted ${watchHistoryDataForSeeding.length} watch history records for demo data`);
    } else {
      console.log('⚠️ No watch history data created for demo data - insufficient profiles or content');
    }


    // Ensure the original watch history seeding is still present
    if (watchHistoryData.length > 0) {
      await queryInterface.bulkInsert('watch_history', watchHistoryData);
      console.log(`✅ Inserted ${watchHistoryData.length} watch history records for continue watching demo`);
    } else {
      console.log('⚠️ No watch history data created for continue watching demo - insufficient profiles or content');
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('watch_history', null, {});
    // Add logic here to delete the content added in the up function if necessary
    // For simplicity, we are only deleting watch_history in down.
    // If content deletion is needed, you would fetch IDs of inserted content and use bulkDelete.
  }
};