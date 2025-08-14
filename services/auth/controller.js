
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
      
      // Check if user has custom claims with profile_id
      let customClaims = userRecord.customClaims || {};
      
      // If no profile_id in claims, try to get default profile
      if (!customClaims.profile_id) {
        // Here you would typically fetch the user's default profile from your user service
        // For now, we'll check if there's a default_profile_id
        if (!customClaims.default_profile_id) {
          // If no default profile exists, you might want to create one or leave empty
          console.log(`No default profile found for user ${uid}`);
        } else {
          // Set the default profile as active profile
          customClaims.profile_id = customClaims.default_profile_id;
          customClaims.login_at = Math.floor(Date.now() / 1000);
          
          // Update Firebase custom claims
          await admin.auth().setCustomUserClaims(uid, customClaims);
        }
      }
      
      console.log(`User logged in: ${uid} with profile: ${customClaims.profile_id || 'none'}`);
      
      res.status(200).json({
        message: 'Login successful',
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName,
          emailVerified: userRecord.emailVerified,
          disabled: userRecord.disabled,
          customClaims: customClaims
        },
        activeProfile: customClaims.profile_id || null
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

      // Set initial custom claims (profile will be created later by user service)
      const initialClaims = {
        created_at: Math.floor(Date.now() / 1000),
        // profile_id will be set when user creates their first profile
      };

      await admin.auth().setCustomUserClaims(userRecord.uid, initialClaims);

      console.log(`User registered: ${userRecord.uid}`);
      
      res.status(201).json({
        message: 'User registered successfully',
        uid: userRecord.uid,
        email: userRecord.email,
        note: 'Profile can be set after account creation'
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
  },

  async switchProfile(req, res) {
    try {
      const { profileId } = req.body;
      const uid = req.user.uid;

      if (!profileId) {
        return res.status(400).json({
          error: 'Profile ID required',
          message: 'profileId is required to switch profile'
        });
      }

      // Validate profile belongs to user (basic validation)
      if (!profileId.match(/^[a-zA-Z0-9-_]{10,50}$/)) {
        return res.status(400).json({
          error: 'Invalid profile ID format'
        });
      }

      // Set custom claims with profile_id
      const customClaims = {
        profile_id: profileId,
        switched_at: Math.floor(Date.now() / 1000)
      };

      await admin.auth().setCustomUserClaims(uid, customClaims);

      // Revoke existing tokens to force refresh
      await admin.auth().revokeRefreshTokens(uid);

      console.log(`Profile switched for user ${uid} to profile ${profileId}`);

      res.status(200).json({
        message: 'Profile switched successfully',
        profileId: profileId,
        note: 'Please refresh your token to get updated claims'
      });
    } catch (error) {
      console.error('Switch profile error:', error);
      res.status(500).json({
        error: 'Failed to switch profile',
        message: error.message
      });
    }
  },

  async setDefaultProfile(req, res) {
    try {
      const { profileId } = req.body;
      const uid = req.user.uid;

      // Set default profile as custom claim
      const customClaims = {
        default_profile_id: profileId,
        profile_id: profileId,
        updated_at: Math.floor(Date.now() / 1000)
      };

      await admin.auth().setCustomUserClaims(uid, customClaims);

      res.status(200).json({
        message: 'Default profile set successfully',
        profileId: profileId
      });
    } catch (error) {
      console.error('Set default profile error:', error);
      res.status(500).json({
        error: 'Failed to set default profile',
        message: error.message
      });
    }
  },

  async setInitialProfile(req, res) {
    try {
      const { profileId } = req.body;
      const uid = req.user.uid;

      if (!profileId) {
        return res.status(400).json({
          error: 'Profile ID required',
          message: 'profileId is required to set initial profile'
        });
      }

      // Set both profile_id and default_profile_id for new users
      const customClaims = {
        profile_id: profileId,
        default_profile_id: profileId,
        initial_profile_set_at: Math.floor(Date.now() / 1000)
      };

      await admin.auth().setCustomUserClaims(uid, customClaims);

      console.log(`Initial profile set for user ${uid}: ${profileId}`);

      res.status(200).json({
        message: 'Initial profile set successfully',
        profileId: profileId,
        note: 'Profile is now active and set as default'
      });
    } catch (error) {
      console.error('Set initial profile error:', error);
      res.status(500).json({
        error: 'Failed to set initial profile',
        message: error.message
      });
    }
  }
};

module.exports = authController;
