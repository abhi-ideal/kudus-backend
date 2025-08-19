
const request = require('supertest');
const app = require('../../index');

class AuthHelper {
  constructor() {
    this.tokens = {};
  }

  async registerUser(userData = {}) {
    const defaultUser = {
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    };
    
    const user = { ...defaultUser, ...userData };
    
    const response = await request(app)
      .post('/api/auth/register')
      .send(user);
    
    return response;
  }

  async loginUser(credentials = {}) {
    const defaultCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    const creds = { ...defaultCredentials, ...credentials };
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(creds);
    
    if (response.body.accessToken) {
      this.tokens[creds.email] = response.body.accessToken;
    }
    
    return response;
  }

  async loginAdmin() {
    const adminCreds = {
      email: 'admin@kudus.com',
      password: 'admin123'
    };
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(adminCreds);
    
    if (response.body.accessToken) {
      this.tokens.admin = response.body.accessToken;
    }
    
    return response;
  }

  getToken(email = 'test@example.com') {
    return this.tokens[email] || this.tokens.admin;
  }

  getAuthHeader(email = 'test@example.com') {
    const token = this.getToken(email);
    return token ? `Bearer ${token}` : '';
  }

  clearTokens() {
    this.tokens = {};
  }
}

module.exports = new AuthHelper();
