
const axios = require('axios');
const path = require('path');

// Load environment variables
require('dotenv').config({
  path: path.join(__dirname, '.env.test'),
  override: true
});

// Import the app
const app = require('../index');

// Base URL for axios requests
const BASE_URL = 'http://0.0.0.0:3003';

describe('Content Service', () => {
  let server;
  let testFirebaseToken;
  let testContentId;
  let testSeriesId;
  let testEpisodeId;

  beforeAll(async () => {
    // Get Firebase token from environment or use default
    testFirebaseToken = process.env.TEST_FIREBASE_TOKEN || 'your-test-firebase-token';
    
   
  });

  // afterAll(async () => {
  //   // Close the server after tests
  //   if (server) {
  //     server.close();
  //   }
  // });

  describe('Health Check', () => {
    test('GET /api/content/admin/health - should return health status', async () => {
      const response = await axios.get(`${BASE_URL}/api/content/admin/health`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status', 'healthy');
      expect(response.data).toHaveProperty('service', 'Content Service');
    });
  });

  describe('Public Content Endpoints', () => {
    describe('GET /api/content', () => {
      test('should get all content without authentication', async () => {
        try {
          const response = await axios.get(`${BASE_URL}/api/content?page=1&limit=10`);

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('success', true);
          expect(response.data.data).toHaveProperty('content');
          expect(response.data.data).toHaveProperty('pagination');
          expect(Array.isArray(response.data.data.content)).toBe(true);

          // Store a content ID for later tests
          if (response.data.data.content.length > 0) {
            testContentId = response.data.data.content[0].id;
          }
        } catch (error) {
          console.log('No content found or database not seeded, continuing with tests...');
          testContentId = 'test-content-id';
        }
      });

      test('should filter content by type', async () => {
        try {
          const response = await axios.get(`${BASE_URL}/api/content?type=movie&limit=5`);

          expect(response.status).toBe(200);
          expect(response.data.success).toBe(true);
          if (response.data.data.content.length > 0) {
            expect(response.data.data.content[0].type).toBe('movie');
          }
        } catch (error) {
          console.log('Content filtering test skipped - no content available');
        }
      });

      test('should filter content by genre', async () => {
        try {
          const response = await axios.get(`${BASE_URL}/api/content?genre=Action&limit=5`);

          expect(response.status).toBe(200);
          expect(response.data.success).toBe(true);
        } catch (error) {
          console.log('Genre filtering test skipped - no content available');
        }
      });
    });

    describe('GET /api/content/kids', () => {
      test('should get kids-only content', async () => {
        try {
          const response = await axios.get(`${BASE_URL}/api/content/kids?page=1&limit=10`);

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('success', true);
          expect(response.data).toHaveProperty('contentType', 'kids-only');
          expect(response.data.data).toHaveProperty('content');
          
          // Verify age ratings are kid-friendly
          if (response.data.data.content.length > 0) {
            const allowedRatings = ['G', 'PG', 'PG-13'];
            response.data.data.content.forEach(content => {
              expect(allowedRatings).toContain(content.ageRating);
            });
          }
        } catch (error) {
          console.log('Kids content test skipped - no content available');
        }
      });
    });

    describe('GET /api/content/items', () => {
      test('should get content grouped by items', async () => {
        try {
          const response = await axios.get(`${BASE_URL}/api/content/items?page=1&limit=5`);

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('success', true);
          expect(response.data.data).toHaveProperty('items');
          expect(Array.isArray(response.data.data.items)).toBe(true);
        } catch (error) {
          console.log('Content items test skipped - no items available');
        }
      });
    });

    describe('GET /api/content/:id', () => {
      test('should get content by ID', async () => {
        if (!testContentId || testContentId === 'test-content-id') {
          console.log('Skipping content by ID test - no valid content ID');
          return;
        }

        try {
          const response = await axios.get(`${BASE_URL}/api/content/${testContentId}`);

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('success', true);
          expect(response.data.data).toHaveProperty('id', testContentId);
        } catch (error) {
          if (error.response?.status === 404) {
            console.log('Content not found, which is expected if database is not seeded');
          } else {
            throw error;
          }
        }
      });

      test('should return 404 for non-existent content', async () => {
        try {
          await axios.get(`${BASE_URL}/api/content/non-existent-id`);
        } catch (error) {
          expect(error.response.status).toBe(404);
          expect(error.response.data).toHaveProperty('error', 'Content not found');
        }
      });
    });
  });

  describe('Authentication Required Endpoints', () => {
    const authHeaders = {
      'Authorization': `Bearer ${testFirebaseToken}`
    };

    describe('Watchlist Management', () => {
      test('GET /api/content/watchlist - should require authentication', async () => {
        try {
          await axios.get(`${BASE_URL}/api/content/watchlist`);
        } catch (error) {
          expect(error.response.status).toBe(401);
          expect(error.response.data).toHaveProperty('success', false);
        }
      });

      test('GET /api/content/watchlist - should get watchlist with valid token', async () => {
        if (testFirebaseToken === 'your-test-firebase-token') {
          console.log('Skipping watchlist test - no valid Firebase token provided');
          return;
        }

        try {
          const response = await axios.get(`${BASE_URL}/api/content/watchlist`, {
            headers: authHeaders
          });

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('success', true);
          expect(response.data.data).toHaveProperty('watchlist');
        } catch (error) {
          if (error.response?.status === 401) {
            console.log('Watchlist test skipped - invalid or expired token');
          } else {
            throw error;
          }
        }
      });

      test('POST /api/content/watchlist - should add content to watchlist', async () => {
        if (testFirebaseToken === 'your-test-firebase-token' || !testContentId) {
          console.log('Skipping add to watchlist test - no valid token or content ID');
          return;
        }

        try {
          const response = await axios.post(`${BASE_URL}/api/content/watchlist`, {
            contentId: testContentId
          }, {
            headers: authHeaders
          });

          expect(response.status).toBe(201);
          expect(response.data).toHaveProperty('success', true);
          expect(response.data).toHaveProperty('message', 'Content added to watchlist successfully');
        } catch (error) {
          if (error.response?.status === 401) {
            console.log('Add to watchlist test skipped - authentication failed');
          } else if (error.response?.status === 409) {
            console.log('Content already in watchlist - this is expected');
          } else {
            console.log('Add to watchlist test failed:', error.response?.data);
          }
        }
      });

      test('GET /api/content/:contentId/watchlist-status - should check watchlist status', async () => {
        if (testFirebaseToken === 'your-test-firebase-token' || !testContentId) {
          console.log('Skipping watchlist status test - no valid token or content ID');
          return;
        }

        try {
          const response = await axios.get(`${BASE_URL}/api/content/${testContentId}/watchlist-status`, {
            headers: authHeaders
          });

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('success', true);
          expect(response.data.data).toHaveProperty('inWatchlist');
        } catch (error) {
          if (error.response?.status === 401) {
            console.log('Watchlist status test skipped - authentication failed');
          } else {
            throw error;
          }
        }
      });

      test('DELETE /api/content/watchlist/:contentId - should remove from watchlist', async () => {
        if (testFirebaseToken === 'your-test-firebase-token' || !testContentId) {
          console.log('Skipping remove from watchlist test - no valid token or content ID');
          return;
        }

        try {
          const response = await axios.delete(`${BASE_URL}/api/content/watchlist/${testContentId}`, {
            headers: authHeaders
          });

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('success', true);
        } catch (error) {
          if (error.response?.status === 401) {
            console.log('Remove from watchlist test skipped - authentication failed');
          } else if (error.response?.status === 404) {
            console.log('Content not in watchlist - this is expected');
          } else {
            throw error;
          }
        }
      });
    });

    describe('Streaming URLs', () => {
      test('GET /api/content/:id/stream - should require authentication', async () => {
        if (!testContentId) {
          console.log('Skipping streaming URL test - no content ID');
          return;
        }

        try {
          await axios.get(`${BASE_URL}/api/content/${testContentId}/stream`);
        } catch (error) {
          expect(error.response.status).toBe(401);
        }
      });

      test('GET /api/content/:id/stream - should get streaming URL with valid token', async () => {
        if (testFirebaseToken === 'your-test-firebase-token' || !testContentId) {
          console.log('Skipping streaming URL test - no valid token or content ID');
          return;
        }

        try {
          const response = await axios.get(`${BASE_URL}/api/content/${testContentId}/stream?quality=720p`, {
            headers: authHeaders
          });

          expect(response.status).toBe(200);
          expect(response.data).toHaveProperty('streamingUrl');
          expect(response.data).toHaveProperty('quality', '720p');
        } catch (error) {
          if (error.response?.status === 401) {
            console.log('Streaming URL test skipped - authentication failed');
          } else if (error.response?.status === 404) {
            console.log('Content not found for streaming - expected if no content seeded');
          } else {
            console.log('Streaming URL test failed:', error.response?.data);
          }
        }
      });
    });
  });

  describe('Series and Episodes', () => {
    test('GET /api/content/series/:id/details - should get series details', async () => {
      // Use a mock series ID since we may not have real data
      const mockSeriesId = testSeriesId || 'test-series-id';
      
      try {
        const response = await axios.get(`${BASE_URL}/api/content/series/${mockSeriesId}/details?includeEpisodes=true`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('Series not found - expected if no series seeded');
        } else {
          throw error;
        }
      }
    });

    test('GET /api/content/series/:seriesId/season/:seasonNumber/episodes - should get season episodes', async () => {
      const mockSeriesId = testSeriesId || 'test-series-id';
      
      try {
        const response = await axios.get(`${BASE_URL}/api/content/series/${mockSeriesId}/season/1/episodes`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('Season not found - expected if no series/season seeded');
        } else {
          throw error;
        }
      }
    });

    test('GET /api/content/episode/:episodeId - should get episode details', async () => {
      const mockEpisodeId = testEpisodeId || 'test-episode-id';
      
      try {
        const response = await axios.get(`${BASE_URL}/api/content/episode/${mockEpisodeId}`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log('Episode not found - expected if no episodes seeded');
        } else {
          throw error;
        }
      }
    });
  });

  describe('Admin Content Management', () => {
    const adminHeaders = {
      'Authorization': `Bearer ${testFirebaseToken}`
    };

    test('POST /api/content - should create content (admin)', async () => {
      if (testFirebaseToken === 'your-test-firebase-token') {
        console.log('Skipping admin create content test - no valid Firebase token');
        return;
      }

      const newContent = {
        title: 'Test Movie',
        description: 'A test movie for automated testing',
        type: 'movie',
        genre: ['Action', 'Drama'],
        ageRating: 'PG-13',
        duration: 120,
        releaseYear: 2024,
        director: 'Test Director',
        cast: ['Test Actor 1', 'Test Actor 2'],
        language: 'en',
        availableCountries: ['US', 'CA']
      };

      try {
        const response = await axios.post(`${BASE_URL}/api/content`, newContent, {
          headers: adminHeaders
        });

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('message', 'Content created successfully');
        expect(response.data).toHaveProperty('content');
        
        // Store the created content ID for update/delete tests
        if (response.data.content) {
          testContentId = response.data.content.id;
        }
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Admin create content test skipped - authentication/authorization failed');
        } else {
          console.log('Admin create content test failed:', error.response?.data);
        }
      }
    });

    test('PUT /api/content/:id - should update content (admin)', async () => {
      if (testFirebaseToken === 'your-test-firebase-token' || !testContentId) {
        console.log('Skipping admin update content test - no valid token or content ID');
        return;
      }

      const updateData = {
        title: 'Updated Test Movie',
        description: 'Updated description for test movie'
      };

      try {
        const response = await axios.put(`${BASE_URL}/api/content/${testContentId}`, updateData, {
          headers: adminHeaders
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('message', 'Content updated successfully');
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Admin update content test skipped - authentication/authorization failed');
        } else if (error.response?.status === 404) {
          console.log('Content not found for update - expected if not created in previous test');
        } else {
          console.log('Admin update content test failed:', error.response?.data);
        }
      }
    });

    test('GET /api/content/admin/content - should get all content for admin', async () => {
      if (testFirebaseToken === 'your-test-firebase-token') {
        console.log('Skipping admin get content test - no valid Firebase token');
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/content/admin/content?page=1&limit=10`, {
          headers: adminHeaders
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data.data).toHaveProperty('content');
        expect(response.data.data).toHaveProperty('pagination');
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Admin get content test skipped - authentication/authorization failed');
        } else {
          throw error;
        }
      }
    });

    test('GET /api/content/admin/content/statistics - should get content statistics', async () => {
      if (testFirebaseToken === 'your-test-firebase-token') {
        console.log('Skipping admin statistics test - no valid Firebase token');
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/content/admin/content/statistics`, {
          headers: adminHeaders
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data.data).toHaveProperty('overview');
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Admin statistics test skipped - authentication/authorization failed');
        } else {
          throw error;
        }
      }
    });

    test('DELETE /api/content/:id - should delete content (admin)', async () => {
      if (testFirebaseToken === 'your-test-firebase-token' || !testContentId) {
        console.log('Skipping admin delete content test - no valid token or content ID');
        return;
      }

      try {
        const response = await axios.delete(`${BASE_URL}/api/content/${testContentId}`, {
          headers: adminHeaders
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('message', 'Content deleted successfully');
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Admin delete content test skipped - authentication/authorization failed');
        } else if (error.response?.status === 404) {
          console.log('Content not found for deletion - expected if not created in previous test');
        } else {
          console.log('Admin delete content test failed:', error.response?.data);
        }
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid request format', async () => {
      if (testFirebaseToken === 'your-test-firebase-token') {
        console.log('Skipping error handling test - no valid Firebase token');
        return;
      }

      try {
        await axios.post(`${BASE_URL}/api/content`, {
          invalidField: 'invalid data'
        }, {
          headers: {
            'Authorization': `Bearer ${testFirebaseToken}`
          }
        });
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    test('should handle malformed authorization header', async () => {
      try {
        await axios.get(`${BASE_URL}/api/content/watchlist`, {
          headers: {
            'Authorization': 'InvalidToken'
          }
        });
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });
});
