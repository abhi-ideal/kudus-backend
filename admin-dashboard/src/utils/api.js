import axios from 'axios';
import { message } from 'antd';

// Individual microservice URLs with admin paths
const AUTH_SERVICE_URL = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://0.0.0.0:3001/api/auth/admin';
const USER_SERVICE_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://0.0.0.0:3002/api/users/admin';
const CONTENT_SERVICE_URL = process.env.REACT_APP_CONTENT_SERVICE_URL || 'http://0.0.0.0:3003/api/content/admin';
const STREAMING_SERVICE_URL = process.env.REACT_APP_STREAMING_SERVICE_URL || 'http://0.0.0.0:3004/api/streaming/admin';
const RECOMMENDATION_SERVICE_URL = process.env.REACT_APP_RECOMMENDATION_SERVICE_URL || 'http://0.0.0.0:3005/api/recommendations/admin';
const ADMIN_SERVICE_URL = process.env.REACT_APP_ADMIN_SERVICE_URL || 'http://0.0.0.0:3006/api/admin';
const COMMON_SERVICE_URL = process.env.REACT_APP_COMMON_SERVICE_URL || 'http://0.0.0.0:3007/api/common/admin';

// Create service-specific API instances
const createServiceAPI = (baseURL) => axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const authAPI = createServiceAPI(AUTH_SERVICE_URL);
const userAPI = createServiceAPI(USER_SERVICE_URL);
const contentAPI = createServiceAPI(CONTENT_SERVICE_URL);
const streamingAPI = createServiceAPI(STREAMING_SERVICE_URL);
const recommendationAPI = createServiceAPI(RECOMMENDATION_SERVICE_URL);
const adminAPI = createServiceAPI(ADMIN_SERVICE_URL);
const commonAPI = createServiceAPI(COMMON_SERVICE_URL);

// Setup interceptors for all service APIs
const setupInterceptors = (apiInstance) => {
  // Request interceptor
  apiInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  apiInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          
          if (auth.currentUser) {
            const newToken = await auth.currentUser.getIdToken(true);
            localStorage.setItem('adminToken', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiInstance(originalRequest);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }

        // If refresh fails, redirect to login
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      message.error(errorMessage);

      return Promise.reject(error);
    }
  );
};

// Apply interceptors to all service APIs
[authAPI, userAPI, contentAPI, streamingAPI, recommendationAPI, adminAPI, commonAPI].forEach(setupInterceptors);

// Admin endpoints object with all admin API functions
const adminEndpoints = {
  // Users API - using userAPI for user-related operations
  getUsers: (params) => userAPI.get('/users', { params }),
  getUserById: (userId) => userAPI.get(`/users/${userId}`),
  blockUser: (userId, reason) => userAPI.patch(`/users/${userId}/block`, { reason }),
  unblockUser: (userId) => userAPI.patch(`/users/${userId}/unblock`),
  updateUserSubscription: (userId, data) => userAPI.patch(`/users/${userId}/subscription`, data),
  getUserStatistics: () => userAPI.get('/users/statistics'),

  // Content API
  getContent: (params) => contentAPI.get('/content', { params }),
  getContentById: (contentId) => contentAPI.get(`/content/${contentId}`),
  createContent: (data) => contentAPI.post('/content', data),
  updateContent: (contentId, data) => contentAPI.put(`/content/${contentId}`, data),
  deleteContent: (contentId) => contentAPI.delete(`/content/${contentId}`),
  getContentStatistics: () => contentAPI.get('/content/statistics'),

  // Season management
  createSeason: (data) => contentAPI.post('/content/seasons', data),
  updateSeason: (id, data) => contentAPI.put(`/content/seasons/${id}`, data),

  // Episode management
  createEpisode: (data) => contentAPI.post('/content/episodes', data),
  updateEpisode: (id, data) => contentAPI.put(`/content/episodes/${id}`, data),
};

// Export individual service APIs for direct access if needed
export { authAPI, userAPI, contentAPI, streamingAPI, recommendationAPI, commonAPI };

// Export adminAPI for backward compatibility
export { adminEndpoints as adminAPI };
export default adminEndpoints;