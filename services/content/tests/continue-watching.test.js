
const request = require('supertest');
const app = require('../index');
const { setupTestDatabase, cleanupTestDatabase } = require('./setup');
const { Content, Episode, Season, WatchHistory, User, UserProfile } = require('../models');
const { v4: uuidv4 } = require('uuid');

describe('Continue Watching API', () => {
  let testProfileId;
  let testUserId;
  let movieContent;
  let seriesContent;
  let testEpisode;
  let testSeason;

  beforeAll(async () => {
    await setupTestDatabase();
    
    // Create test user
    testUserId = uuidv4();
    await User.create({
      id: testUserId,
      firebaseUid: 'test-firebase-uid-continue',
      email: 'continue@test.com',
      firstName: 'Continue',
      lastName: 'Test'
    });

    // Create test profile
    testProfileId = uuidv4();
    await UserProfile.create({
      id: testProfileId,
      userId: testUserId,
      profileName: 'Continue Test Profile',
      isChild: false
    });

    // Create test movie content
    movieContent = await Content.create({
      id: uuidv4(),
      title: 'Test Movie for Continue Watching',
      description: 'A test movie',
      type: 'movie',
      genre: ['Action', 'Adventure'],
      duration: 120, // 120 minutes
      releaseYear: 2023,
      videoUrl: 'https://example.com/test-movie.mp4',
      thumbnailUrl: {
        "150x150": "https://example.com/movie-150x150.jpg",
        "300x300": "https://example.com/movie-300x300.jpg"
      },
      status: 'published'
    });

    // Create test series content
    seriesContent = await Content.create({
      id: uuidv4(),
      title: 'Test Series for Continue Watching',
      description: 'A test series',
      type: 'series',
      genre: ['Drama', 'Thriller'],
      releaseYear: 2023,
      status: 'published'
    });

    // Create test season
    testSeason = await Season.create({
      id: uuidv4(),
      seriesId: seriesContent.id,
      seasonNumber: 1,
      title: 'Season 1',
      totalEpisodes: 10
    });

    // Create test episode
    testEpisode = await Episode.create({
      id: uuidv4(),
      seasonId: testSeason.id,
      seriesId: seriesContent.id,
      episodeNumber: 1,
      title: 'Pilot Episode',
      description: 'The first episode',
      duration: 45, // 45 minutes
      videoUrl: 'https://example.com/test-episode.mp4',
      thumbnailUrl: {
        "150x150": "https://example.com/episode-150x150.jpg",
        "300x300": "https://example.com/episode-300x300.jpg"
      }
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up watch history before each test
    await WatchHistory.destroy({ where: { profileId: testProfileId } });
  });

  describe('GET /api/content/profiles/:profileId/continue-watching', () => {
    test('should return empty list when no incomplete content', async () => {
      const response = await request(app)
        .get(`/api/content/profiles/${testProfileId}/continue-watching`)
        .expect(200);

      expect(response.body.continueWatching).toHaveLength(0);
      expect(response.body.totalItems).toBe(0);
      expect(response.body.profileId).toBe(testProfileId);
    });

    test('should return incomplete movie in continue watching list', async () => {
      // Create incomplete movie watch history (60% watched)
      await WatchHistory.create({
        id: uuidv4(),
        profileId: testProfileId,
        contentId: movieContent.id,
        episodeId: null,
        watchedAt: new Date(),
        watchDuration: 72, // 72 minutes out of 120
        totalDuration: 120,
        progressPercentage: 60.0,
        isCompleted: false,
        deviceType: 'web'
      });

      const response = await request(app)
        .get(`/api/content/profiles/${testProfileId}/continue-watching`)
        .expect(200);

      expect(response.body.continueWatching).toHaveLength(1);
      
      const movieItem = response.body.continueWatching[0];
      expect(movieItem.contentType).toBe('movie');
      expect(movieItem.title).toBe(movieContent.title);
      expect(movieItem.progressPercentage).toBe(60.0);
      expect(movieItem.videoUrl).toBe(movieContent.videoUrl);
      expect(movieItem.resumeInfo.canResume).toBe(true);
      expect(movieItem.resumeInfo.subtitle).toBe('60% watched');
    });

    test('should return incomplete episode in continue watching list', async () => {
      // Create incomplete episode watch history (40% watched)
      await WatchHistory.create({
        id: uuidv4(),
        profileId: testProfileId,
        contentId: seriesContent.id,
        episodeId: testEpisode.id,
        watchedAt: new Date(),
        watchDuration: 18, // 18 minutes out of 45
        totalDuration: 45,
        progressPercentage: 40.0,
        isCompleted: false,
        deviceType: 'mobile'
      });

      const response = await request(app)
        .get(`/api/content/profiles/${testProfileId}/continue-watching`)
        .expect(200);

      expect(response.body.continueWatching).toHaveLength(1);
      
      const episodeItem = response.body.continueWatching[0];
      expect(episodeItem.contentType).toBe('episode');
      expect(episodeItem.title).toBe(seriesContent.title);
      expect(episodeItem.progressPercentage).toBe(40.0);
      expect(episodeItem.videoUrl).toBe(testEpisode.videoUrl);
      expect(episodeItem.episodeInfo.episodeNumber).toBe(1);
      expect(episodeItem.episodeInfo.seasonNumber).toBe(1);
      expect(episodeItem.resumeInfo.canResume).toBe(true);
      expect(episodeItem.resumeInfo.subtitle).toContain('S1E1');
    });

    test('should not return completed content', async () => {
      // Create completed movie watch history (100% watched)
      await WatchHistory.create({
        id: uuidv4(),
        profileId: testProfileId,
        contentId: movieContent.id,
        episodeId: null,
        watchedAt: new Date(),
        watchDuration: 120, // Full duration
        totalDuration: 120,
        progressPercentage: 100.0,
        isCompleted: true,
        deviceType: 'web'
      });

      const response = await request(app)
        .get(`/api/content/profiles/${testProfileId}/continue-watching`)
        .expect(200);

      expect(response.body.continueWatching).toHaveLength(0);
    });

    test('should not return barely started content (less than 5%)', async () => {
      // Create barely started movie watch history (2% watched)
      await WatchHistory.create({
        id: uuidv4(),
        profileId: testProfileId,
        contentId: movieContent.id,
        episodeId: null,
        watchedAt: new Date(),
        watchDuration: 2, // 2 minutes out of 120
        totalDuration: 120,
        progressPercentage: 1.67,
        isCompleted: false,
        deviceType: 'web'
      });

      const response = await request(app)
        .get(`/api/content/profiles/${testProfileId}/continue-watching`)
        .expect(200);

      expect(response.body.continueWatching).toHaveLength(0);
    });

    test('should return multiple continue watching items ordered by watch date', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Create older incomplete movie watch history
      await WatchHistory.create({
        id: uuidv4(),
        profileId: testProfileId,
        contentId: movieContent.id,
        episodeId: null,
        watchedAt: yesterday,
        watchDuration: 60,
        totalDuration: 120,
        progressPercentage: 50.0,
        isCompleted: false,
        deviceType: 'web'
      });

      // Create newer incomplete episode watch history
      await WatchHistory.create({
        id: uuidv4(),
        profileId: testProfileId,
        contentId: seriesContent.id,
        episodeId: testEpisode.id,
        watchedAt: now,
        watchDuration: 20,
        totalDuration: 45,
        progressPercentage: 44.4,
        isCompleted: false,
        deviceType: 'mobile'
      });

      const response = await request(app)
        .get(`/api/content/profiles/${testProfileId}/continue-watching`)
        .expect(200);

      expect(response.body.continueWatching).toHaveLength(2);
      
      // Should be ordered by most recent first
      expect(response.body.continueWatching[0].contentType).toBe('episode');
      expect(response.body.continueWatching[1].contentType).toBe('movie');
    });

    test('should respect limit parameter', async () => {
      // Create multiple incomplete watch histories
      for (let i = 0; i < 5; i++) {
        await WatchHistory.create({
          id: uuidv4(),
          profileId: testProfileId,
          contentId: movieContent.id,
          episodeId: null,
          watchedAt: new Date(Date.now() - i * 60000), // Different times
          watchDuration: 30 + i,
          totalDuration: 120,
          progressPercentage: 25.0 + i,
          isCompleted: false,
          deviceType: 'web'
        });
      }

      const response = await request(app)
        .get(`/api/content/profiles/${testProfileId}/continue-watching?limit=3`)
        .expect(200);

      expect(response.body.continueWatching).toHaveLength(3);
    });

    test('should return 400 for missing profileId', async () => {
      const response = await request(app)
        .get('/api/content/profiles//continue-watching')
        .expect(400);

      expect(response.body.error).toBe('Profile ID is required');
    });
  });

  describe('Video URL Management', () => {
    test('should return correct video URL for movies', async () => {
      await WatchHistory.create({
        id: uuidv4(),
        profileId: testProfileId,
        contentId: movieContent.id,
        episodeId: null,
        watchedAt: new Date(),
        watchDuration: 60,
        totalDuration: 120,
        progressPercentage: 50.0,
        isCompleted: false,
        deviceType: 'web'
      });

      const response = await request(app)
        .get(`/api/content/profiles/${testProfileId}/continue-watching`)
        .expect(200);

      const movieItem = response.body.continueWatching[0];
      expect(movieItem.videoUrl).toBe('https://example.com/test-movie.mp4');
      expect(movieItem.contentType).toBe('movie');
    });

    test('should return correct video URL for episodes', async () => {
      await WatchHistory.create({
        id: uuidv4(),
        profileId: testProfileId,
        contentId: seriesContent.id,
        episodeId: testEpisode.id,
        watchedAt: new Date(),
        watchDuration: 20,
        totalDuration: 45,
        progressPercentage: 44.4,
        isCompleted: false,
        deviceType: 'mobile'
      });

      const response = await request(app)
        .get(`/api/content/profiles/${testProfileId}/continue-watching`)
        .expect(200);

      const episodeItem = response.body.continueWatching[0];
      expect(episodeItem.videoUrl).toBe('https://example.com/test-episode.mp4');
      expect(episodeItem.contentType).toBe('episode');
      expect(episodeItem.episodeId).toBe(testEpisode.id);
    });

    test('should handle series without episode data gracefully', async () => {
      // Create watch history with missing episode data
      await WatchHistory.create({
        id: uuidv4(),
        profileId: testProfileId,
        contentId: seriesContent.id,
        episodeId: null, // No episode ID
        watchedAt: new Date(),
        watchDuration: 20,
        totalDuration: 45,
        progressPercentage: 44.4,
        isCompleted: false,
        deviceType: 'mobile'
      });

      const response = await request(app)
        .get(`/api/content/profiles/${testProfileId}/continue-watching`)
        .expect(200);

      const seriesItem = response.body.continueWatching[0];
      expect(seriesItem.contentType).toBe('series');
      expect(seriesItem.videoUrl).toBeNull();
      expect(seriesItem.resumeInfo.canResume).toBe(false);
      expect(seriesItem.resumeInfo.reason).toBe('Episode data unavailable');
    });
  });
});
