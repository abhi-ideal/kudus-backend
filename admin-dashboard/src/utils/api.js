import axios from 'axios';
import { message } from 'antd';

// Individual microservice URLs with admin endpoints
const AUTH_SERVICE_URL = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://0.0.0.0:3001/api/auth/admin';
const USER_SERVICE_URL = process.env.REACT_APP_USER_SERVICE_URL || 'http://0.0.0.0:3002/api/users/admin';
const CONTENT_SERVICE_URL = process.env.REACT_APP_CONTENT_SERVICE_URL || 'http://0.0.0.0:3005/api/content/admin';
const STREAMING_SERVICE_URL = process.env.REACT_APP_STREAMING_SERVICE_URL || 'http://0.0.0.0:3004/api/streaming/admin';
const RECOMMENDATION_SERVICE_URL = process.env.REACT_APP_RECOMMENDATION_SERVICE_URL || 'http://0.0.0.0:3003/api/recommendations/admin';
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
const commonAPI = createServiceAPI(COMMON_SERVICE_URL); // Use the base common service URL

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

      // Don't show error messages for Chrome extension errors
      if (error.message && error.message.includes('message port closed')) {
        console.warn('Chrome extension interference detected, ignoring error');
        return Promise.reject(error);
      }

      const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
      message.error(errorMessage);

      return Promise.reject(error);
    }
  );
};

// Apply interceptors to all service APIs
[authAPI, userAPI, contentAPI, streamingAPI, recommendationAPI, commonAPI].forEach(setupInterceptors);

// Admin endpoints object with all admin API functions
const adminEndpoints = {
  // Users API - using userAPI which points to user service admin endpoint
  getUsers: (params) => userAPI.get('/users', { params }),
  getUserById: (userId) => userAPI.get(`/users/${userId}`),
  blockUser: (userId, reason) => userAPI.patch(`/users/${userId}/block`, { reason }),
  unblockUser: (userId) => userAPI.patch(`/users/${userId}/unblock`),
  updateUserSubscription: (userId, subscriptionData) =>
    userAPI.patch(`/users/${userId}/subscription`, subscriptionData),

  getUserActivity: (userId, params = {}) =>
    userAPI.get(`/users/${userId}/activity`, { params }),

  getUserStatistics: () => userAPI.get('/users/statistics'),

  // Content management
  getContent: (params) => contentAPI.get('/content', { params }),
  getContentById: (contentId) => contentAPI.get(`/content/${contentId}`),
  createContent: (data) => contentAPI.post('/content', data),
  updateContent: (contentId, data) => contentAPI.put(`/content/${contentId}`, data),
  deleteContent: (contentId) => contentAPI.delete(`/content/${contentId}`),
  featureContent: (id) => contentAPI.post(`/content/${id}/feature`),
  unfeatureContent: (id) => contentAPI.post(`/content/${id}/unfeature`),

  // Season management
  createSeason: (data) => contentAPI.post('/content/seasons', data),
  updateSeason: (id, data) => contentAPI.put(`/content/seasons/${id}`, data),

  // Episode management
  createEpisode: (data) => contentAPI.post('/content/episodes', data),
  updateEpisode: (id, data) => contentAPI.put(`/content/episodes/${id}`, data),

  // Common Service Endpoints
  // Genres
  getGenres: () => commonAPI.get('/genres'),
  getAllGenresAdmin: () => commonAPI.get('/genres'),
  createGenre: (data) => commonAPI.post('/genres', data),
  updateGenre: (id, data) => commonAPI.put(`/genres/${id}`, data),
  updateGenreChildProfile: (id, data) =>
    commonAPI.patch(`/genres/${id}/child-profile`, data),
  deleteGenre: (id) => commonAPI.delete(`/admin/genres/${id}`),

  // Content Items API
  getContentItems: (params) => contentAPI.get('/items', { params }),
  getAllContentItems: (params) => contentAPI.get('/items', { params }),
  createContentItem: (data) => contentAPI.post('/items', data),
  updateContentItem: (id, data) => contentAPI.put(`/items/${id}`, data),
  deleteContentItem: (id) => contentAPI.delete(`/items/${id}`),

  // Thumbnail Management API
  updateContentThumbnails: (contentId, thumbnails) => 
    contentAPI.patch(`/admin/content/${contentId}/thumbnails`, { thumbnails }),

  // Get signed URL for thumbnail upload
  getSignedUrlForThumbnailUpload: (uploadData) =>
    commonAPI.post('/upload/thumbnail/signed-url', uploadData),
  getThumbnailRatios: () => contentAPI.get('/thumbnail-ratios'),
  updateContentItemOrder: (id, orderData) =>
    contentAPI.patch(`/content/items/${id}/order`, orderData),
  updateContentItemChildProfile: (id, data) =>
    contentAPI.patch(`/content/items/${id}/child-profile`, data),

  // Content Mappings API
  getContentMappings: (params) => contentAPI.get('/mappings', { params }),
  createContentMapping: (data) => contentAPI.post('/mappings', data),
  updateContentMapping: (id, data) => contentAPI.put(`/mappings/${id}`, data),
  deleteContentMapping: (id) => contentAPI.delete(`/mappings/${id}`),

  // FAQ Management Endpoints - using help-articles endpoint from routes
  getFaqs: (params) => commonAPI.get('/help-articles', { params: { ...params, isFAQ: true } }),
  getFaqById: (id) => commonAPI.get(`/help-articles/${id}`),
  createFaq: (data) => commonAPI.post('/help-articles', { ...data, isFAQ: true }),
  updateFaq: (id, data) => commonAPI.put(`/help-articles/${id}`, data),
  deleteFaq: (id) => commonAPI.delete(`/help-articles/${id}`),

  // Contact Us Management Endpoints
  getContactUsEntries: (params) => commonAPI.get('/contact-us', { params }),
  getContactUsEntryById: (id) => commonAPI.get(`/contact-us/${id}`),
  updateContactUsEntry: (id, data) => commonAPI.put(`/contact-us/${id}`, data),
  deleteContactUsEntry: (id) => commonAPI.delete(`/contact-us/${id}`),

  // Privacy Policy Management Endpoints
  getPrivacyPolicy: () => commonAPI.get('/privacy-policies'),
  updatePrivacyPolicy: (data) => commonAPI.put('/privacy-policies', data),

  // Terms & Conditions Management Endpoints
  getTermsConditions: () => commonAPI.get('/terms-conditions-list'),
  updateTermsAndConditions: (data) => commonAPI.put('/terms-conditions', data),


  // Generic HTTP methods - using commonAPI as fallback
  get: (url, config) => commonAPI.get(url, config),
  post: (url, data, config) => commonAPI.post(url, data, config),
  put: (url, data, config) => commonAPI.put(url, data, config),
  delete: (url, config) => commonAPI.delete(url, config),
};

// Content Items API (for drag and drop functionality)
const contentItemsAPI = {
  getAllContentItemsForDragDrop: () => contentAPI.get('/admin/items?limit=100'),
  updateContentItemsOrder: (items) => contentAPI.patch('/admin/items/reorder', { items }),

  // Content Mappings API
  getContentMappings: (params) => contentAPI.get('/mappings', { params }),
  createContentMapping: (data) => contentAPI.post('/mappings', data),
  updateContentMapping: (id, data) => contentAPI.put(`/mappings/${id}`, data),
  deleteContentMapping: (id) => contentAPI.delete(`/mappings/${id}`),

  // Content Management API
};

// Export individual service APIs for direct access if needed
export { authAPI, userAPI, contentAPI, streamingAPI, recommendationAPI, commonAPI };
export { contentItemsAPI };

// Export adminEndpoints for admin functionality
export { adminEndpoints };
export default adminEndpoints;