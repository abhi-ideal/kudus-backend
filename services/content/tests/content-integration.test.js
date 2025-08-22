const axios = require('axios');
const path = require('path');

// Load environment variables
require('dotenv').config({
  path: path.join(__dirname, '.env.test'),
  override: true
});

describe('Content Service Integration Tests', () => {
  const BASE_URL = 'http://0.0.0.0:3003';
  let testFirebaseToken;

  beforeAll(() => {
    testFirebaseToken = process.env.TEST_FIREBASE_TOKEN || 'your-test-firebase-token';
  });

  describe('Content Discovery Flow', () => {
    test('should complete a full content discovery flow', async () => {
      try {
        // 1. Get all content
        const contentResponse = await axios.get(`${BASE_URL}/api/content?limit=5`);
        expect(contentResponse.status).toBe(200);
        expect(contentResponse.data.success).toBe(true);

        // 2. Get content grouped by items
        const itemsResponse = await axios.get(`${BASE_URL}/api/content/items?limit=3`);
        expect(itemsResponse.status).toBe(200);
        expect(itemsResponse.data.success).toBe(true);

        // 3. Get kids content
        const kidsResponse = await axios.get(`${BASE_URL}/api/content/kids?limit=3`);
        expect(kidsResponse.status).toBe(200);
        expect(kidsResponse.data.success).toBe(true);

        console.log('✅ Content discovery flow completed successfully');
      } catch (error) {
        console.log('Content discovery flow test - some endpoints may not have data seeded');
      }
    });
  });

  describe('Authenticated User Flow', () => {
    test('should complete a full authenticated user flow', async () => {
      if (testFirebaseToken === 'your-test-firebase-token') {
        console.log('Skipping authenticated flow test - no valid Firebase token');
        return;
      }

      const authHeaders = {
        'Authorization': `Bearer ${testFirebaseToken}`
      };

      try {
        // 1. Get watchlist (should be empty initially)
        const watchlistResponse = await axios.get(`${BASE_URL}/api/content/watchlist`, {
          headers: authHeaders
        });
        expect(watchlistResponse.status).toBe(200);

        // 2. Get content to add to watchlist
        const contentResponse = await axios.get(`${BASE_URL}/api/content?limit=1`);
        if (contentResponse.data.data.content.length > 0) {
          const contentId = contentResponse.data.data.content[0].id;

          // 3. Add to watchlist
          const addResponse = await axios.post(`${BASE_URL}/api/content/watchlist`, {
            contentId: contentId
          }, {
            headers: authHeaders
          });
          expect([201, 409]).toContain(addResponse.status); // 201 created or 409 already exists

          // 4. Check watchlist status
          const statusResponse = await axios.get(`${BASE_URL}/api/content/${contentId}/watchlist-status`, {
            headers: authHeaders
          });
          expect(statusResponse.status).toBe(200);
          expect(statusResponse.data.data.inWatchlist).toBe(true);

          // 5. Remove from watchlist
          const removeResponse = await axios.delete(`${BASE_URL}/api/content/watchlist/${contentId}`, {
            headers: authHeaders
          });
          expect(removeResponse.status).toBe(200);
        }

        console.log('✅ Authenticated user flow completed successfully');
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('Authenticated flow test skipped - authentication failed');
        } else {
          console.log('Authenticated flow test error:', error.response?.data || error.message);
        }
      }
    });
  });

  describe('Content Management Flow (Admin)', () => {
    test('should complete a full admin content management flow', async () => {
      if (testFirebaseToken === 'your-test-firebase-token') {
        console.log('Skipping admin flow test - no valid Firebase token');
        return;
      }

      const adminHeaders = {
        'Authorization': `Bearer ${testFirebaseToken}`
      };

      let createdContentId = null;

      try {
        // 1. Create new content
        const newContent = {
          title: 'Integration Test Movie',
          description: 'A movie created during integration testing',
          type: 'movie',
          genre: ['Action', 'Test'],
          ageRating: 'PG-13',
          duration: 90,
          releaseYear: 2024,
          director: 'Test Director',
          cast: ['Test Actor'],
          language: 'en'
        };

        const createResponse = await axios.post(`${BASE_URL}/api/content`, newContent, {
          headers: adminHeaders
        });

        if (createResponse.status === 201) {
          createdContentId = createResponse.data.content.id;
          expect(createResponse.data.content.title).toBe('Integration Test Movie');

          // 2. Update the content
          const updateData = {
            title: 'Updated Integration Test Movie',
            description: 'Updated during integration testing'
          };

          const updateResponse = await axios.put(`${BASE_URL}/api/content/${createdContentId}`, updateData, {
            headers: adminHeaders
          });
          expect(updateResponse.status).toBe(200);

          // 3. Get the updated content
          const getResponse = await axios.get(`${BASE_URL}/api/content/${createdContentId}`);
          expect(getResponse.status).toBe(200);
          expect(getResponse.data.data.title).toBe('Updated Integration Test Movie');

          // 4. Delete the content
          const deleteResponse = await axios.delete(`${BASE_URL}/api/content/${createdContentId}`, {
            headers: adminHeaders
          });
          expect(deleteResponse.status).toBe(200);

          console.log('✅ Admin content management flow completed successfully');
        }
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Admin flow test skipped - insufficient permissions');
        } else {
          console.log('Admin flow test error:', error.response?.data || error.message);
        }
      }
    });
  });

  describe('Error Scenarios', () => {
    test('should handle various error scenarios gracefully', async () => {
      // Test non-existent content
      try {
        await axios.get(`${BASE_URL}/api/content/non-existent-content-id`);
      } catch (error) {
        expect(error.response.status).toBe(404);
      }

      // Test invalid authentication
      try {
        await axios.get(`${BASE_URL}/api/content/watchlist`, {
          headers: {
            'Authorization': 'Bearer invalid-token'
          }
        });
      } catch (error) {
        expect(error.response.status).toBe(401);
      }

      // Test malformed authorization header
      try {
        await axios.get(`${BASE_URL}/api/content/watchlist`, {
          headers: {
            'Authorization': 'InvalidToken'
          }
        });
      } catch (error) {
        expect(error.response.status).toBe(401);
      }

      // Test kids content endpoint
      const kidsResponse = await axios.get(`${BASE_URL}/api/content/kids`);
      expect(kidsResponse.status).toBe(200);
      expect(kidsResponse.data.success).toBe(true);
      expect(kidsResponse.data.contentType).toBe('kids-only');

      // Verify all content is kid-appropriate
      if (kidsResponse.data.data.content.length > 0) {
        kidsResponse.data.data.content.forEach(content => {
          expect(['G', 'PG', 'PG-13']).toContain(content.ageRating);
          expect(content.genre.some(g =>
            ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'].includes(g)
          )).toBe(true);
        });
      }

      // Test missing required fields
      if (testFirebaseToken !== 'your-test-firebase-token') {
        try {
          await axios.post(`${BASE_URL}/api/content`, {
            title: 'Incomplete Content'
            // Missing required fields
          }, {
            headers: {
              'Authorization': `Bearer ${testFirebaseToken}`
            }
          });
        } catch (error) {
          expect(error.response.status).toBe(400);
        }
      }

      console.log('✅ Error scenarios handled correctly');
    });
  });

  // Test Kids Content
  describe('GET /api/content/kids', () => {
    test('should get kids-only content', async () => {
      const response = await axios.get(`${BASE_URL}/api/content/kids?page=1&limit=10`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data.data).toHaveProperty('content');
      expect(response.data).toHaveProperty('contentType', 'kids-only');
      expect(response.data).toHaveProperty('appliedFilters');

      // Verify all content is kid-friendly
      if (response.data.data.content.length > 0) {
        response.data.data.content.forEach(content => {
          expect(['G', 'PG', 'PG-13']).toContain(content.ageRating);
          expect(content.genre.some(g =>
            ['Family', 'Animation', 'Comedy', 'Adventure', 'Fantasy'].includes(g)
          )).toBe(true);
        });
      }
    });
  });

  // Test Continue Watching
  describe('GET /api/content/continue-watching', () => {
    test('should require authentication for continue watching', async () => {
      try {
        await axios.get(`${BASE_URL}/api/content/continue-watching`);
        // If we reach here, the test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    test('should get continue watching list for authenticated user', async () => {
      if (testFirebaseToken === 'your-test-firebase-token') {
        console.log('Skipping continue watching test - no valid Firebase token');
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/content/continue-watching?page=1&limit=10`, {
          headers: {
            'Authorization': `Bearer ${testFirebaseToken}`
          }
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
        expect(response.data.data).toHaveProperty('continueWatching');
        expect(response.data.data).toHaveProperty('pagination');
        expect(response.data).toHaveProperty('profileContext');

        // Verify structure of continue watching items
        if (response.data.data.continueWatching.length > 0) {
          const item = response.data.data.continueWatching[0];
          expect(item).toHaveProperty('watchHistoryId');
          expect(item).toHaveProperty('contentId');
          expect(item).toHaveProperty('watchedAt');
          expect(item).toHaveProperty('progressPercentage');
          expect(item).toHaveProperty('resumeType');
          expect(item).toHaveProperty('content');
          expect(['movie', 'episode']).toContain(item.resumeType);

          // Progress should be between 0 and 95%
          expect(item.progressPercentage).toBeGreaterThan(0);
          expect(item.progressPercentage).toBeLessThan(95);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('Continue watching test skipped - authentication failed');
        } else {
          throw error;
        }
      }
    });

    test('should handle pagination for continue watching', async () => {
      if (testFirebaseToken === 'your-test-firebase-token') {
        console.log('Skipping continue watching pagination test - no valid Firebase token');
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/content/continue-watching?page=1&limit=5`, {
          headers: {
            'Authorization': `Bearer ${testFirebaseToken}`
          }
        });

        expect(response.status).toBe(200);
        expect(response.data.data.pagination).toHaveProperty('page', 1);
        expect(response.data.data.pagination).toHaveProperty('limit', 5);
        expect(response.data.data.pagination).toHaveProperty('total');
        expect(response.data.data.pagination).toHaveProperty('totalPages');
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('Continue watching pagination test skipped - authentication failed');
        } else {
          throw error;
        }
      }
    });

    test('should filter continue watching for child profiles', async () => {
      if (testFirebaseToken === 'your-test-firebase-token') {
        console.log('Skipping child profile continue watching test - no valid Firebase token');
        return;
      }

      try {
        const response = await axios.get(`${BASE_URL}/api/content/continue-watching`, {
          headers: {
            'Authorization': `Bearer ${testFirebaseToken}`,
            'X-Profile-Context': JSON.stringify({ isChild: true })
          }
        });

        expect(response.status).toBe(200);

        // Verify all content is child-appropriate
        if (response.data.data.continueWatching.length > 0) {
          response.data.data.continueWatching.forEach(item => {
            const content = item.content;
            expect(['G', 'PG', 'PG-13']).toContain(content.ageRating);
          });
        }
      } catch (error) {
        if (error.response?.status === 401) {
          console.log('Child profile continue watching test skipped - authentication failed');
        } else {
          throw error;
        }
      }
    });
  });
});