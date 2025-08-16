
import axios from 'axios';
import { message } from 'antd';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://0.0.0.0:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
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
api.interceptors.response.use(
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

// API endpoints
export const adminAPI = {
  // User management
  getUsers: (params) => api.get('/api/admin/users', { params }),
  getUserById: (id) => api.get(`/api/admin/users/${id}`),
  blockUser: (id, reason) => api.patch(`/api/admin/users/${id}/block`, { reason }),
  unblockUser: (id) => api.patch(`/api/admin/users/${id}/unblock`),
  updateUserSubscription: (id, data) => api.patch(`/api/admin/users/${id}/subscription`, data),
  getUserStatistics: () => api.get('/api/admin/users/statistics'),

  // Content management
  getContent: (params) => api.get('/api/admin/content', { params }),
  getContentById: (id) => api.get(`/api/admin/content/${id}`),
  createContent: (data) => api.post('/api/admin/content', data),
  updateContent: (id, data) => api.put(`/api/admin/content/${id}`, data),
  deleteContent: (id) => api.delete(`/api/admin/content/${id}`),

  // Season management
  createSeason: (data) => api.post('/api/admin/content/seasons', data),
  updateSeason: (id, data) => api.put(`/api/admin/content/seasons/${id}`, data),

  // Episode management
  createEpisode: (data) => api.post('/api/admin/content/episodes', data),
  updateEpisode: (id, data) => api.put(`/api/admin/content/episodes/${id}`, data),
};

export default api;
