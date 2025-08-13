
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const authController = {
  async login(req, res) {
    try {
      const { idToken } = req.body;
      
      if (!idToken) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'idToken is required'
        });
      }

      // Verify the Firebase ID token
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const uid = decodedToken.uid;
      
      // Get user record from Firebase
      const userRecord = await admin.auth().getUser(uid);
      
      console.log(`User logged in: ${uid}`);
      
      res.status(200).json({
        message: 'Login successful',
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          emailVerified: userRecord.emailVerified,
          disabled: userRecord.disabled
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Please refresh your token and try again'
        });
      }
      
      if (error.code === 'auth/invalid-id-token') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'The provided token is invalid'
        });
      }
      
      res.status(500).json({
        error: 'Login failed',
        message: error.message
      });
    }
  },

  async register(req, res) {
    try {
      const { email, password, displayName } = req.body;
      
      // Create user in Firebase Auth
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName
      });

      console.log(`User registered: ${userRecord.uid}`);
      
      res.status(201).json({
        message: 'User registered successfully',
        uid: userRecord.uid,
        email: userRecord.email
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({
        error: 'Registration failed',
        message: error.message
      });
    }
  },

  async socialLogin(req, res) {
    try {
      const { provider, token } = req.body;
      
      // Verify the social provider token
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      res.status(200).json({
        message: 'Social login successful',
        uid: decodedToken.uid,
        provider: decodedToken.firebase.sign_in_provider
      });
    } catch (error) {
      console.error('Social login error:', error);
      res.status(401).json({
        error: 'Social login failed',
        message: error.message
      });
    }
  },

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      
      // Firebase handles token refresh on client side
      res.status(200).json({
        message: 'Use Firebase Auth SDK for token refresh',
        instructions: 'Call getIdToken(true) to refresh token'
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        error: 'Token refresh failed',
        message: error.message
      });
    }
  },

  async logout(req, res) {
    try {
      const { uid } = req.user;
      
      // Revoke refresh tokens for the user
      await admin.auth().revokeRefreshTokens(uid);
      
      console.log(`User logged out: ${uid}`);
      
      res.status(200).json({
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'Logout failed',
        message: error.message
      });
    }
  }
};

module.exports = authController;
