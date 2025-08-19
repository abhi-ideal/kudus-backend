
// Mock Firebase Admin to prevent initialization issues
module.exports = {
  initializeFirebaseAdmin: jest.fn().mockReturnValue(null),
  verifyToken: jest.fn().mockResolvedValue({ uid: 'test-user' }),
  admin: {
    auth: jest.fn().mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: 'test-user' })
    })
  }
};
// Mock Firebase Admin SDK for testing
const mockAuth = () => ({
  verifyIdToken: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com'
  }),
  createUser: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com'
  }),
  updateUser: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com'
  }),
  deleteUser: jest.fn().mockResolvedValue(undefined),
  getUserByEmail: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com'
  })
});

const mockAdmin = {
  auth: mockAuth,
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  apps: []
};

module.exports = {
  admin: mockAdmin,
  initializeFirebaseAdmin: jest.fn().mockReturnValue(mockAdmin),
  verifyToken: jest.fn().mockResolvedValue({
    uid: 'test-user-id',
    email: 'test@example.com'
  }),
  getMockAuth: jest.fn().mockReturnValue(mockAuth())
};
