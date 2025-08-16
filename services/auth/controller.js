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
      const { displayName } = req.body;

      // Get Firebase token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Firebase auth token is required in Authorization header'
        });
      }

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

      // Generate a default username from displayName or email
      const defaultUsername = authController.generateDefaultUsername(displayName || userRecord.displayName || userEmail);

      try {
        // Create default profile in user service
        const defaultProfile = await authController.createDefaultProfile(firebaseUid, defaultUsername);

        // Set custom claims with the default profile and user role
        const initialClaims = {
          created_at: Math.floor(Date.now() / 1000),
          profile_id: defaultProfile.id,
          default_profile_id: defaultProfile.id,
          username: defaultUsername,
          role: 'user',
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
      const { userId } = req.user;

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
      }

      logger.info('User logged out successfully');

      res.json({
        success: true,
        message: 'Logout successful'
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
   * Create default profile by directly inserting into database tables
   */
  async createDefaultProfile(firebaseUid, username) {
    const { v4: uuidv4 } = require('uuid');
    const { DataTypes } = require('sequelize');
    const { sequelize } = require('./config/database');
    
    try {
      logger.info(`Starting profile creation for user: ${firebaseUid} with username: ${username}`);

      // Define User model directly (since auth and user services share same DB)
      const UserModel = sequelize.define('User', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        firebaseUid: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true
        },
        email: {
          type: DataTypes.STRING,
          allowNull: true
        },
        firstName: {
          type: DataTypes.STRING,
          allowNull: true
        },
        lastName: {
          type: DataTypes.STRING,
          allowNull: true
        },
        displayName: {
          type: DataTypes.STRING,
          allowNull: true
        },
        profilePicture: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        dateOfBirth: {
          type: DataTypes.DATE,
          allowNull: true
        },
        phoneNumber: {
          type: DataTypes.STRING,
          allowNull: true
        },
        subscriptionType: {
          type: DataTypes.ENUM('free', 'basic', 'standard', 'premium'),
          defaultValue: 'free'
        },
        subscriptionStatus: {
          type: DataTypes.ENUM('active', 'inactive', 'cancelled', 'expired'),
          defaultValue: 'active'
        },
        subscriptionStartDate: {
          type: DataTypes.DATE,
          allowNull: true
        },
        subscriptionEndDate: {
          type: DataTypes.DATE,
          allowNull: true
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        emailVerified: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        lastLoginAt: {
          type: DataTypes.DATE,
          allowNull: true
        }
      }, {
        tableName: 'users',
        timestamps: true
      });

      // Define UserProfile model directly
      const UserProfileModel = sequelize.define('UserProfile', {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true
        },
        userId: {
          type: DataTypes.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false
        },
        avatar: {
          type: DataTypes.TEXT,
          allowNull: true
        },
        isKidsProfile: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        ageRating: {
          type: DataTypes.ENUM('G', 'PG', 'PG-13', 'R', 'NC-17'),
          defaultValue: 'R'
        },
        language: {
          type: DataTypes.STRING,
          defaultValue: 'en'
        },
        autoplayNext: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        autoplayPreviews: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        subtitles: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        subtitleLanguage: {
          type: DataTypes.STRING,
          defaultValue: 'en'
        },
        audioLanguage: {
          type: DataTypes.STRING,
          defaultValue: 'en'
        },
        maturityLevel: {
          type: DataTypes.INTEGER,
          defaultValue: 18
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        }
      }, {
        tableName: 'user_profiles',
        timestamps: true
      });

      // Check if user already exists
      let user = await UserModel.findOne({
        where: { firebaseUid: firebaseUid }
      });

      // Create user if doesn't exist
      if (!user) {
        logger.info('Creating user record in database...');
        user = await UserModel.create({
          firebaseUid: firebaseUid,
          email: '', // Will be updated later
          firstName: username,
          lastName: '',
          displayName: username,
          subscriptionType: 'free',
          subscriptionStatus: 'active',
          isActive: true,
          emailVerified: false
        });
        logger.info(`User created with ID: ${user.id}`);
      } else {
        logger.info(`User already exists with ID: ${user.id}`);
      }

      // Create default profile
      logger.info('Creating default profile in database...');
      const defaultProfile = await UserProfileModel.create({
        userId: user.id,
        name: username,
        avatar: null,
        isKidsProfile: false,
        ageRating: 'R',
        language: 'en',
        autoplayNext: true,
        autoplayPreviews: true,
        subtitles: false,
        subtitleLanguage: 'en',
        audioLanguage: 'en',
        maturityLevel: 18,
        isActive: true
      });

      logger.info(`Default profile created successfully: ${defaultProfile.id}`);
      
      return {
        id: defaultProfile.id,
        name: defaultProfile.name,
        userId: user.id,
        isKidsProfile: defaultProfile.isKidsProfile,
        avatar: defaultProfile.avatar
      };
      
    } catch (error) {
      logger.error('Error creating default profile:', {
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