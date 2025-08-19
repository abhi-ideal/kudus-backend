
const mockData = {
  users: {
    validUser: {
      firebaseUid: 'test-firebase-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true
    },
    adminUser: {
      firebaseUid: 'admin-firebase-uid-456',
      email: 'admin@example.com',
      displayName: 'Admin User',
      emailVerified: true,
      role: 'admin'
    },
    kidsProfile: {
      name: 'Kids Profile',
      isKidsProfile: true,
      ageRating: 'G',
      maturityLevel: 7
    }
  },

  firebaseTokens: {
    validUserToken: 'mock-valid-user-token',
    validAdminToken: 'mock-valid-admin-token',
    invalidToken: 'mock-invalid-token',
    expiredToken: 'mock-expired-token'
  },

  decodedTokens: {
    validUser: {
      uid: 'test-firebase-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      email_verified: true,
      firebase: {
        sign_in_provider: 'google.com'
      }
    },
    validAdmin: {
      uid: 'admin-firebase-uid-456',
      email: 'admin@example.com',
      name: 'Admin User',
      email_verified: true,
      role: 'admin',
      firebase: {
        sign_in_provider: 'password'
      }
    }
  },

  content: {
    movie: {
      title: 'Test Movie',
      type: 'movie',
      description: 'A test movie for unit testing',
      genre: 'Action',
      ageRating: 'PG-13',
      duration: 120,
      releaseYear: 2023
    },
    series: {
      title: 'Test Series',
      type: 'series',
      description: 'A test series for unit testing',
      genre: 'Drama',
      ageRating: 'TV-14',
      releaseYear: 2023
    }
  },

  profiles: {
    adultProfile: {
      name: 'Adult Profile',
      isKidsProfile: false,
      ageRating: 'R',
      maturityLevel: 18,
      language: 'en'
    },
    teenProfile: {
      name: 'Teen Profile',
      isKidsProfile: false,
      ageRating: 'PG-13',
      maturityLevel: 13,
      language: 'en'
    }
  }
};

module.exports = mockData;
