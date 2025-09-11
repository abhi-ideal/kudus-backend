const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const logger = require('./utils/logger');
const User = require('./models/User');
const UserProfile = require('./models/UserProfile');
const LoginHistory = require('./models/LoginHistory');

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

// Helper functions for device detection
function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  } else if (ua.includes('smart-tv') || ua.includes('roku') || ua.includes('chromecast')) {
    return 'tv';
  } else {
    return 'desktop';
  }
}

function getBrowserInfo(userAgent) {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  return 'Other';
}

function getOSInfo(userAgent) {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  return 'Other';
}


const authController = {
  async login(req, res) {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        return res.status(400).json({ error: 'ID token is required' });
      }

      // Verify the ID token with Firebase
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // Find or create user in database
      let user = await User.findOne({ where: { firebaseUid: decodedToken.uid } });

      if (!user) {
        // Create new user record
        user = await User.create({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          displayName: decodedToken.name,
          emailVerified: decodedToken.email_verified,
          lastLoginAt: new Date()
        });
        logger.info(`New user created: ${user.id}`);
      } else {
        // Update last login
        await user.update({
          lastLoginAt: new Date()
        });

        // Fetch user profiles
        const profiles = await UserProfile.findAll({
          where: { 
            userId: user.id,
            isActive: true
          }
        });

        // Create login history entry
        await LoginHistory.create({
          userId: user.id,
          loginAt: new Date(),
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          deviceType: getDeviceType(req.get('User-Agent')),
          deviceInfo: {
            browser: getBrowserInfo(req.get('User-Agent')),
            os: getOSInfo(req.get('User-Agent'))
          },
          loginMethod: 'firebase',
          isActive: true
        });

        // Set Firebase custom claims with default profile (first profile or most recent)
        const defaultProfile = profiles.length > 0 ? profiles[0] : null;
        if (defaultProfile) {
          const customClaims = {
            profile_id: defaultProfile.id,
            child: defaultProfile.isKidsProfile || false,
            default_profile_id: defaultProfile.id,
            role: 'user',
            logged_in_at: Math.floor(Date.now() / 1000)
          };

          await admin.auth().setCustomUserClaims(user.firebaseUid, customClaims);
          logger.info(`Custom claims set for user ${user.firebaseUid}:`, customClaims);
        }

        // Generate tokens (not stored in DB)
        const accessToken = jwt.sign(
          {
            userId: user.id,
            firebaseUid: user.firebaseUid,
            email: user.email,
            profileIds: profiles.map(p => p.id)
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        logger.info(`User logged in successfully: ${user.email}`);

        res.json({
          success: true,
          message: 'Login successful',
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            profilePicture: user.profilePicture,
            subscriptionType: user.subscriptionType,
            subscriptionStatus: user.subscriptionStatus,
            profiles: profiles.map(profile => ({
              id: profile.id,
              name: profile.name,
              avatar: profile.avatar,
              isKidsProfile: profile.isKidsProfile
            }))
          },
          accessToken
        });
      }
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({ error: 'Invalid ID token' });
    }
  },

  async register(req, res) {
    try {
      // Get Firebase token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Firebase auth token is required in Authorization header'
        });
      }
      const { displayName } = req.body;

      const idToken = authHeader.split(' ')[1];

      // Verify the Firebase token and extract user info
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const firebaseUid = decodedToken.uid;
      const userEmail = decodedToken.email;

      // Get full user record from Firebase
      const userRecord = await admin.auth().getUser(firebaseUid);

      // Check if user already exists in database
      const existingUser = await User.findOne({ 
        where: { firebaseUid: firebaseUid } 
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'User already registered',
          message: 'User with this Firebase UID already exists in database'
        });
      }
      console.log('displayName', displayName, 'userEmail', userEmail, 'userRecord.displayName', userRecord.displayName);
      // Generate a default username from email
      const defaultUsername =  displayName || userEmail || userRecord.displayName;

      try {
        // Create default profile in user service
        const defaultProfile = await authController.createDefaultProfile(firebaseUid, defaultUsername, userEmail);

        // Set custom claims with the default profile and user role
        const initialClaims = {
          created_at: Math.floor(Date.now() / 1000),
          profile_id: defaultProfile.id,
          default_profile_id: defaultProfile.id,
          username: defaultUsername,
          role: 'user',
          child: defaultProfile.isKidsProfile || false,
          registered: true
        };

        await admin.auth().setCustomUserClaims(firebaseUid, initialClaims);

        logger.info(`User registered: ${firebaseUid} with default profile: ${defaultProfile.id}`);

        res.status(201).json({
          message: 'User registered successfully',
          uid: firebaseUid,
          email: userEmail,
          role: 'user',
          defaultProfile: {
            id: defaultProfile.id,
            username: defaultUsername
          },
          note: 'Default profile created and custom claims set with user role'
        });
      } catch (profileError) {
        logger.error('Failed to create default profile:', profileError);

        // If profile creation fails, still set basic claims
        const initialClaims = {
          created_at: Math.floor(Date.now() / 1000),
          username: defaultUsername,
          role: 'user',
          child: false, // Default to false when profile creation fails
          registered: true
        };

        await admin.auth().setCustomUserClaims(firebaseUid, initialClaims);

        res.status(201).json({
          message: 'User registered successfully',
          uid: firebaseUid,
          email: userEmail,
          role: 'user',
          username: defaultUsername,
          warning: 'Default profile creation failed, can be created later'
        });
      }
    } catch (error) {
      logger.error('Registration error:', error);

      if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({
          error: 'Token expired',
          message: 'Firebase auth token has expired'
        });
      }

      if (error.code === 'auth/invalid-id-token') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'Invalid Firebase auth token'
        });
      }

      if (error.code === 'auth/user-not-found') {
        return res.status(404).json({
          error: 'Firebase user not found',
          message: 'User does not exist in Firebase Auth'
        });
      }

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
      const authHeader = req.headers.authorization;
      let userId = null;
      let firebaseUid = null;

      // Try to get user info from token if available
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.split(' ')[1];
          const decodedToken = await admin.auth().verifyIdToken(token);
          firebaseUid = decodedToken.uid;
          
          // Find user by Firebase UID
          const user = await User.findOne({ where: { firebaseUid: firebaseUid } });
          if (user) {
            userId = user.id;
          }
        } catch (tokenError) {
          logger.warn('Token verification failed during logout:', tokenError.message);
          // Continue with logout even if token is invalid
        }
      }

      // If we have a userId, update login history
      if (userId) {
        // Find the most recent active login session and mark it as inactive
        const recentLogin = await LoginHistory.findOne({
          where: {
            userId: userId,
            isActive: true,
            logoutAt: null
          },
          order: [['loginAt', 'DESC']]
        });

        if (recentLogin) {
          const logoutTime = new Date();
          const sessionDuration = Math.floor((logoutTime - recentLogin.loginAt) / 1000); // in seconds

          await recentLogin.update({
            logoutAt: logoutTime,
            sessionDuration: sessionDuration,
            isActive: false
          });

          logger.info(`User ${userId} logged out successfully`);
        }
      }

      // Revoke Firebase tokens if we have the UID
      if (firebaseUid) {
        try {
          await admin.auth().revokeRefreshTokens(firebaseUid);
          logger.info(`Firebase tokens revoked for user ${firebaseUid}`);
        } catch (revokeError) {
          logger.warn('Failed to revoke Firebase tokens:', revokeError.message);
          // Don't fail the logout if token revocation fails
        }
      }

      res.json({
        success: true,
        message: 'Logout successful',
        note: 'Session terminated and tokens revoked'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error.message
      });
    }
  },

  async logoutAll(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication token required'
        });
      }

      const token = authHeader.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const firebaseUid = decodedToken.uid;

      // Find user by Firebase UID
      const user = await User.findOne({ where: { firebaseUid: firebaseUid } });
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User record not found in database'
        });
      }

      // Mark all active sessions as logged out
      const activeSessions = await LoginHistory.findAll({
        where: {
          userId: user.id,
          isActive: true,
          logoutAt: null
        }
      });

      const logoutTime = new Date();
      for (const session of activeSessions) {
        const sessionDuration = Math.floor((logoutTime - session.loginAt) / 1000);
        await session.update({
          logoutAt: logoutTime,
          sessionDuration: sessionDuration,
          isActive: false
        });
      }

      // Revoke all Firebase refresh tokens
      await admin.auth().revokeRefreshTokens(firebaseUid);

      logger.info(`All sessions terminated for user ${user.id}`);

      res.json({
        success: true,
        message: 'All sessions terminated successfully',
        sessionsTerminated: activeSessions.length
      });
    } catch (error) {
      logger.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to terminate all sessions',
        error: error.message
      });
    }
  },

  // Switch active profile
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

      // Get profile details to determine if it's a child profile
      let isChildProfile = false;
      let user = null;
      try {
        // Find user by Firebase UID to get user ID
        user = await User.findOne({ where: { firebaseUid: uid } });
        if (user) {
          const profile = await UserProfile.findOne({
            where: { 
              id: profileId,
              userId: user.id,
              isActive: true 
            }
          });
          if (profile) {
            isChildProfile = profile.isKidsProfile || false;
          } else {
            return res.status(404).json({
              error: 'Profile not found',
              message: 'Profile not found or does not belong to user'
            });
          }
        } else {
          return res.status(404).json({
            error: 'User not found',
            message: 'User record not found'
          });
        }
      } catch (dbError) {
        logger.warn('Could not fetch profile details for child check:', dbError.message);
        return res.status(500).json({
          error: 'Database error',
          message: 'Failed to validate profile'
        });
      }

      // Set custom claims with profile_id and child flag
      const customClaims = {
        profile_id: profileId,
        child: isChildProfile,
        switched_at: Math.floor(Date.now() / 1000),
        role: 'user'
      };

      await admin.auth().setCustomUserClaims(uid, customClaims);

      // Generate new custom token with updated claims
      const customToken = await admin.auth().createCustomToken(uid, customClaims);

      // Generate new JWT token for API access
      const accessToken = jwt.sign(
        {
          userId: user.id,
          firebaseUid: uid,
          email: user.email,
          profileId: profileId,
          isChild: isChildProfile
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      logger.info(`Profile switched for user ${uid} to profile ${profileId}, child: ${isChildProfile}`);

      res.status(200).json({
        success: true,
        message: 'Profile switched successfully',
        profileId: profileId,
        isChild: isChildProfile,
        customToken: customToken,
        accessToken: accessToken,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName
        }
      });
    } catch (error) {
      logger.error('Switch profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to switch profile',
        message: error.message
      });
    }
  },

  // Set default profile
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

  /**
   * Generate a default username from display name or email
   */
  generateDefaultUsername(input) {
    if (!input) return 'user';

    // If it's an email, take the part before @
    if (input.includes('@')) {
      input = input.split('@')[0];
    }

    // Clean the username: remove spaces, special chars, make lowercase
    let username = input
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20); // Limit to 20 characters

    // Ensure it's not empty
    if (!username) {
      username = 'user';
    }

    // Add timestamp to make it unique
    const timestamp = Date.now().toString().slice(-4);
    return `${username}${timestamp}`;
  },

  /**
   * Create default profile by directly inserting into database tables with transaction rollback
   */
  async createDefaultProfile(firebaseUid, username, userEmail) {
    const sequelize = require('./config/database');

    // Use database transaction for rollback capability
    const transaction = await sequelize.transaction();

    try {
      logger.info(`Starting profile creation for user: ${firebaseUid} with username: ${username}`);

      // Check if user already exists
      let user = await User.findOne({
        where: { firebaseUid: firebaseUid },
        transaction
      });

      let userCreated = false;

      // Create user if doesn't exist
      if (!user) {
        logger.info('Creating user record in database...');
        user = await User.create({
          firebaseUid: firebaseUid,
          email: userEmail || `${username}@temp.com`, // Use actual email or fallback to temporary
          displayName: username,
          subscriptionType: 'free',
          subscriptionStatus: 'active',
          preferences: {},
          parentalControls: {},
          language: 'en',
          isActive: true,
          isOwner: 1, // First user is owner
          emailVerified: false
        }, { transaction });

        userCreated = true;
        logger.info(`User created with ID: ${user.id}`);
      } else {
        logger.info(`User already exists with ID: ${user.id}`);
      }

      // Create default profile
      logger.info('Creating default profile in database...');
      const defaultProfile = await UserProfile.create({
        userId: user.id,
        name: username,
        avatar: null,
        isKidsProfile: false, // Default profile is not a kids profile
        ageRating: 'R',
        language: 'en',
        autoplayNext: true,
        autoplayPreviews: true,
        subtitles: false,
        subtitleLanguage: 'en',
        audioLanguage: 'en',
        maturityLevel: 18,
        isActive: true
      }, { transaction });

      // Commit the transaction
      await transaction.commit();

      logger.info(`Default profile created successfully: ${defaultProfile.id}`);

      return {
        id: defaultProfile.id,
        name: defaultProfile.name,
        userId: user.id,
        isKidsProfile: defaultProfile.isKidsProfile || false,
        avatar: defaultProfile.avatar
      };

    } catch (error) {
      // Rollback the transaction
      await transaction.rollback();

      logger.error('Error creating default profile - transaction rolled back:', {
        error: error.message,
        stack: error.stack,
        firebaseUid,
        username
      });

      throw new Error(`Failed to create default profile: ${error.message}`);
    }
  }
};

module.exports = {
  login: authController.login,
  register: authController.register,
  socialLogin: authController.socialLogin,
  logout: authController.logout,
  logoutAll: authController.logoutAll,
  verifyToken: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      res.json({
        valid: true,
        uid: decodedToken.uid,
        email: decodedToken.email
      });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  },
  refreshToken: authController.refreshToken,
  switchProfile: authController.switchProfile,
  setDefaultProfile: authController.setDefaultProfile
};