
const admin = require('firebase-admin');

let firebaseApp = null;

const initializeFirebaseAdmin = () => {
  // Skip Firebase initialization in test environment
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_FIREBASE === 'true') {
    console.log('Skipping Firebase initialization in test environment');
    return null;
  }

  // Return existing app if already initialized
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if Firebase is already initialized by another service
  if (admin.apps.length > 0) {
    firebaseApp = admin.app();
    return firebaseApp;
  }

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    // Validate required fields
    if (!serviceAccount.projectId || !serviceAccount.privateKey || !serviceAccount.clientEmail) {
      console.warn('Firebase credentials incomplete, skipping initialization');
      return null;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error.message);
    return null;
  }
};

// Mock Firebase auth for tests
const getMockAuth = () => ({
  verifyIdToken: async (token) => {
    if (token === 'mock-admin-token') {
      return { uid: 'mock-admin-uid', email: 'admin@test.com', admin: true };
    }
    if (token === 'mock-user-token') {
      return { uid: 'mock-user-uid', email: 'user@test.com' };
    }
    throw new Error('Invalid token');
  }
});

const getFirebaseAuth = () => {
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_FIREBASE === 'true') {
    return getMockAuth();
  }
  
  const app = initializeFirebaseAdmin();
  return app ? admin.auth(app) : getMockAuth();
};

module.exports = {
  initializeFirebaseAdmin,
  getFirebaseAuth,
  admin
};
