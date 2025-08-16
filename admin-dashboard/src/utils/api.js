import axios from 'axios';
import { message } from 'antd';

// Individual microservice URLs
const AUTH_SERVICE_URL = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://0.0.0.0:3001';
const USER_SERVICE_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://0.0.0.0:3002';
const CONTENT_SERVICE_URL = process.env.REACT_APP_CONTENT_SERVICE_URL || 'http://0.0.0.0:3003';
const STREAMING_SERVICE_URL = process.env.REACT_APP_STREAMING_SERVICE_URL || 'http://0.0.0.0:3004';
const RECOMMENDATION_SERVICE_URL = process.env.REACT_APP_RECOMMENDATION_SERVICE_URL || 'http://0.0.0.0:3005';
const ADMIN_SERVICE_URL = process.env.REACT_APP_ADMIN_SERVICE_URL || 'http://0.0.0.0:3006';
const COMMON_SERVICE_URL = process.env.REACT_APP_COMMON_SERVICE_URL || 'http://0.0.0.0:3007';

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
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
      }

      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      message.error(errorMessage);

      return Promise.reject(error);
    }
  );
};

// Apply interceptors to all service APIs
[authAPI, userAPI, contentAPI, streamingAPI, recommendationAPI, adminAPI, commonAPI].forEach(setupInterceptors);

// API endpoints using correct microservices
export const adminEndpoints = {
  // User management (Admin Service handles admin user operations)
  getUsers: (params) => adminAPI.get('/api/admin/users', { params }),
  getUserById: (id) => adminAPI.get(`/api/admin/users/${id}`),
  blockUser: (id, reason) => adminAPI.patch(`/api/admin/users/${id}/block`, { reason }),
  unblockUser: (id) => adminAPI.patch(`/api/admin/users/${id}/unblock`),
  updateUserSubscription: (id, data) => adminAPI.patch(`/api/admin/users/${id}/subscription`, data),
  getUserStatistics: () => adminAPI.get('/api/admin/users/statistics'),

  // Content management (Content Service handles content operations)
  getContent: (params) => contentAPI.get('/api/admin/content', { params }),
  getContentById: (id) => contentAPI.get(`/api/admin/content/${id}`),
  createContent: (data) => contentAPI.post('/api/admin/content', data),
  updateContent: (id, data) => contentAPI.put(`/api/admin/content/${id}`, data),
  deleteContent: (id) => contentAPI.delete(`/api/admin/content/${id}`),

  // Season management
  createSeason: (data) => contentAPI.post('/api/admin/content/seasons', data),
  updateSeason: (id, data) => contentAPI.put(`/api/admin/content/seasons/${id}`, data),

  // Episode management
  createEpisode: (data) => contentAPI.post('/api/admin/content/episodes', data),
  updateEpisode: (id, data) => contentAPI.put(`/api/admin/content/episodes/${id}`, data),
};

// Export individual service APIs for direct access if needed
export { authAPI, userAPI, contentAPI, streamingAPI, recommendationAPI, commonAPI };

// Admin endpoints object with all admin API functions
const adminEndpoints = {
  // Users API
  getUsers: (params) => adminAPI.get('/api/admin/users', { params }),
  getUserById: (userId) => adminAPI.get(`/api/admin/users/${userId}`),
  blockUser: (userId, reason) => adminAPI.post(`/api/admin/users/${userId}/block`, { reason }),
  unblockUser: (userId) => adminAPI.post(`/api/admin/users/${userId}/unblock`),
  updateUserSubscription: (userId, data) => adminAPI.put(`/api/admin/users/${userId}/subscription`, data),
  getUserStatistics: () => adminAPI.get('/api/admin/users/statistics'),

  // Content API
  getContent: (params) => contentAPI.get('/api/admin/content', { params }),
  getContentById: (contentId) => contentAPI.get(`/api/admin/content/${contentId}`),
  createContent: (data) => contentAPI.post('/api/admin/content', data),
  updateContent: (contentId, data) => contentAPI.put(`/api/admin/content/${contentId}`, data),
  deleteContent: (contentId) => contentAPI.delete(`/api/admin/content/${contentId}`),
  getContentStatistics: () => contentAPI.get('/api/admin/content/statistics'),
};

// Export adminAPI for backward compatibility
export const adminAPI = adminEndpoints;
export default adminEndpoints;