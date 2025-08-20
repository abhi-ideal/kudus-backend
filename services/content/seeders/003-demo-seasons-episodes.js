
'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get series content to add seasons and episodes
    const [series] = await queryInterface.sequelize.query(
      "SELECT id FROM content WHERE type = 'series' LIMIT 1"
    );
    
    if (series.length === 0) {
      console.log('No series found, skipping seasons and episodes seeding');
      return;
    }
    
    const seriesId = series[0].id;
    
    // Create seasons
    const season1Id = uuidv4();
    const season2Id = uuidv4();
    
    await queryInterface.bulkInsert('seasons', [
      {
        id: season1Id,
        seriesId: seriesId,
        seasonNumber: 1,
        title: 'Season 1: The Beginning',
        description: 'The first season that introduces our main characters and the central mystery.',
        posterImages: JSON.stringify({
          thumbnail: 'https://example.com/seasons/s1-thumb.jpg',
          medium: 'https://example.com/seasons/s1-med.jpg',
          hd: 'https://example.com/seasons/s1-hd.jpg',
          original: 'https://example.com/seasons/s1-orig.jpg'
        }),
        releaseDate: new Date('2023-01-15'),
        totalEpisodes: 6,
        status: 'completed',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: season2Id,
        seriesId: seriesId,
        seasonNumber: 2,
        title: 'Season 2: Deeper Mysteries',
        description: 'The mystery deepens as new secrets are revealed and old alliances are tested.',
        posterImages: JSON.stringify({
          thumbnail: 'https://example.com/seasons/s2-thumb.jpg',
          medium: 'https://example.com/seasons/s2-med.jpg',
          hd: 'https://example.com/seasons/s2-hd.jpg',
          original: 'https://example.com/seasons/s2-orig.jpg'
        }),
        releaseDate: new Date('2023-06-15'),
        totalEpisodes: 8,
        status: 'airing',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create episodes for Season 1
    await queryInterface.bulkInsert('episodes', [
      {
        id: uuidv4(),
        seasonId: season1Id,
        seriesId: seriesId,
        episodeNumber: 1,
        title: 'Pilot',
        description: 'The story begins when Detective Morgan receives a mysterious case.',
        duration: 45,
        thumbnailUrl: JSON.stringify({
          "150x150": 'https://example.com/episodes/s1e1-150x150.jpg',
          "300x300": 'https://example.com/episodes/s1e1-300x300.jpg',
          "500x500": 'https://example.com/episodes/s1e1-500x500.jpg',
          "800x800": 'https://example.com/episodes/s1e1-800x800.jpg',
          "1080x1080": 'https://example.com/episodes/s1e1-1080x1080.jpg'
        }),
        videoQualities: JSON.stringify({
          '480p': 'https://example.com/videos/s1e1-480p.mp4',
          '720p': 'https://example.com/videos/s1e1-720p.mp4',
          '1080p': 'https://example.com/videos/s1e1-1080p.mp4'
        }),
        airDate: new Date('2023-01-15'),
        rating: 8.5,
        views: 125000,
        likes: 8900,
        status: 'published',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        seasonId: season1Id,
        seriesId: seriesId,
        episodeNumber: 2,
        title: 'First Clues',
        description: 'The first clues lead to unexpected discoveries.',
        duration: 42,
        thumbnailUrl: JSON.stringify({
          "150x150": 'https://example.com/episodes/s1e2-150x150.jpg',
          "300x300": 'https://example.com/episodes/s1e2-300x300.jpg',
          "500x500": 'https://example.com/episodes/s1e2-500x500.jpg',
          "800x800": 'https://example.com/episodes/s1e2-800x800.jpg',
          "1080x1080": 'https://example.com/episodes/s1e2-1080x1080.jpg'
        }),
        videoQualities: JSON.stringify({
          '480p': 'https://example.com/videos/s1e2-480p.mp4',
          '720p': 'https://example.com/videos/s1e2-720p.mp4',
          '1080p': 'https://example.com/videos/s1e2-1080p.mp4'
        }),
        airDate: new Date('2023-01-22'),
        rating: 8.7,
        views: 118000,
        likes: 9200,
        status: 'published',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        seasonId: season1Id,
        seriesId: seriesId,
        episodeNumber: 3,
        title: 'Hidden Connections',
        description: 'Connections between seemingly unrelated events start to emerge.',
        duration: 44,
        thumbnailUrl: JSON.stringify({
          "150x150": 'https://example.com/episodes/s1e3-150x150.jpg',
          "300x300": 'https://example.com/episodes/s1e3-300x300.jpg',
          "500x500": 'https://example.com/episodes/s1e3-500x500.jpg',
          "800x800": 'https://example.com/episodes/s1e3-800x800.jpg',
          "1080x1080": 'https://example.com/episodes/s1e3-1080x1080.jpg'
        }),
        videoQualities: JSON.stringify({
          '480p': 'https://example.com/videos/s1e3-480p.mp4',
          '720p': 'https://example.com/videos/s1e3-720p.mp4',
          '1080p': 'https://example.com/videos/s1e3-1080p.mp4'
        }),
        airDate: new Date('2023-01-29'),
        rating: 9.1,
        views: 132000,
        likes: 10500,
        status: 'published',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Create episodes for Season 2
    await queryInterface.bulkInsert('episodes', [
      {
        id: uuidv4(),
        seasonId: season2Id,
        seriesId: seriesId,
        episodeNumber: 1,
        title: 'New Beginnings',
        description: 'Season 2 opens with new mysteries and returning characters.',
        duration: 48,
        thumbnailUrl: JSON.stringify({
          "150x150": 'https://example.com/episodes/s2e1-150x150.jpg',
          "300x300": 'https://example.com/episodes/s2e1-300x300.jpg',
          "500x500": 'https://example.com/episodes/s2e1-500x500.jpg',
          "800x800": 'https://example.com/episodes/s2e1-800x800.jpg',
          "1080x1080": 'https://example.com/episodes/s2e1-1080x1080.jpg'
        }),
        videoQualities: JSON.stringify({
          '480p': 'https://example.com/videos/s2e1-480p.mp4',
          '720p': 'https://example.com/videos/s2e1-720p.mp4',
          '1080p': 'https://example.com/videos/s2e1-1080p.mp4'
        }),
        airDate: new Date('2023-06-15'),
        rating: 9.3,
        views: 145000,
        likes: 12000,
        status: 'published',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        seasonId: season2Id,
        seriesId: seriesId,
        episodeNumber: 2,
        title: 'The Plot Thickens',
        description: 'New revelations complicate the already complex mystery.',
        duration: 46,
        thumbnailUrl: JSON.stringify({
          "150x150": 'https://example.com/episodes/s2e2-150x150.jpg',
          "300x300": 'https://example.com/episodes/s2e2-300x300.jpg',
          "500x500": 'https://example.com/episodes/s2e2-500x500.jpg',
          "800x800": 'https://example.com/episodes/s2e2-800x800.jpg',
          "1080x1080": 'https://example.com/episodes/s2e2-1080x1080.jpg'
        }),
        videoQualities: JSON.stringify({
          '480p': 'https://example.com/videos/s2e2-480p.mp4',
          '720p': 'https://example.com/videos/s2e2-720p.mp4',
          '1080p': 'https://example.com/videos/s2e2-1080p.mp4'
        }),
        airDate: new Date('2023-06-22'),
        rating: 9.0,
        views: 138000,
        likes: 11200,
        status: 'published',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('episodes', null, {});
    await queryInterface.bulkDelete('seasons', null, {});
  }
};
