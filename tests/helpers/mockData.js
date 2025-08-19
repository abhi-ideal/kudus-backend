
const { v4: uuidv4 } = require('uuid');

const mockData = {
  users: {
    validUser: {
      email: 'testuser@example.com',
      displayName: 'Test User',
      subscriptionType: 'free'
    },
    adminUser: {
      email: 'admin@kudus.com',
      displayName: 'Admin User',
      role: 'admin'
    },
    invalidUser: {
      email: 'invalid-email',
      displayName: ''
    }
  },

  profiles: {
    validProfile: {
      name: 'Test Profile',
      isKidsProfile: false,
      ageRating: 'PG-13',
      language: 'en'
    },
    kidsProfile: {
      name: 'Kids Profile',
      isKidsProfile: true,
      ageRating: 'G',
      language: 'en'
    },
    invalidProfile: {
      name: '',
      isKidsProfile: 'not-boolean'
    }
  },

  content: {
    validMovie: {
      title: 'Test Movie',
      description: 'A test movie for unit tests',
      type: 'movie',
      genre: ['action', 'drama'],
      ageRating: 'PG-13',
      duration: 120,
      releaseYear: 2024,
      language: 'en',
      availableCountries: ['US', 'CA']
    },
    validSeries: {
      title: 'Test Series',
      description: 'A test series for unit tests',
      type: 'series',
      genre: ['comedy'],
      ageRating: 'PG',
      releaseYear: 2024,
      language: 'en',
      availableCountries: ['US']
    },
    invalidContent: {
      title: '',
      type: 'invalid-type',
      duration: -1
    }
  },

  generateId: () => uuidv4()
};

module.exports = mockData;
