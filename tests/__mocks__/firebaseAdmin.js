
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
