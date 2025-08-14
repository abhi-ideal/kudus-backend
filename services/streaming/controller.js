
const logger = require('../../shared/utils/logger');
const awsService = require('../content/services/awsService');

// In-memory session storage (use Redis in production)
const activeSessions = new Map();

// Clean up inactive sessions every 5 minutes
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 5 * 60 * 1000; // 5 minutes
  
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastHeartbeat > inactiveThreshold) {
      logger.info(`Cleaning up inactive session: ${sessionId}`);
      activeSessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000);

const streamingController = {
  async startSession(req, res) {
    try {
      const { contentId, quality = '720p' } = req.body;
      const userId = req.user.uid;
      
      const sessionId = `${userId}_${contentId}_${Date.now()}`;
      
      // Generate streaming URL
      const streamingUrl = await awsService.generateSignedUrl(contentId, quality);
      
      const session = {
        id: sessionId,
        userId,
        contentId,
        quality,
        startTime: new Date(),
        currentPosition: 0,
        streamingUrl,
        lastHeartbeat: new Date(),
        isActive: true,
        totalWatchTime: 0,
        bufferHealth: 100,
        networkSpeed: null,
        deviceInfo: null
      };
      
      activeSessions.set(sessionId, session);
      
      logger.info(`Streaming session started: ${sessionId}`);
      
      res.status(201).json({
        sessionId,
        streamingUrl,
        quality,
        message: 'Playback session started successfully'
      });
    } catch (error) {
      logger.error('Start session error:', error);
      res.status(500).json({
        error: 'Failed to start playback session',
        message: error.message
      });
    }
  },

  async updateSession(req, res) {
    try {
      const { sessionId } = req.params;
      const { position, quality } = req.body;
      
      const session = activeSessions.get(sessionId);
      
      if (!session) {
        return res.status(404).json({
          error: 'Session not found'
        });
      }
      
      // Update session data
      session.currentPosition = position;
      session.lastUpdated = new Date();
      
      if (quality && quality !== session.quality) {
        session.quality = quality;
        session.streamingUrl = await awsService.generateSignedUrl(session.contentId, quality);
      }
      
      activeSessions.set(sessionId, session);
      
      res.json({
        message: 'Session updated successfully',
        currentPosition: position,
        quality: session.quality,
        streamingUrl: session.streamingUrl
      });
    } catch (error) {
      logger.error('Update session error:', error);
      res.status(500).json({
        error: 'Failed to update session',
        message: error.message
      });
    }
  },

  async endSession(req, res) {
    try {
      const { sessionId } = req.params;
      
      const session = activeSessions.get(sessionId);
      
      if (!session) {
        return res.status(404).json({
          error: 'Session not found'
        });
      }
      
      // Calculate session duration
      const duration = Math.floor((new Date() - session.startTime) / 1000);
      
      // Save to watch history (implement with your database)
      // await saveToWatchHistory(session, duration);
      
      activeSessions.delete(sessionId);
      
      logger.info(`Streaming session ended: ${sessionId}, duration: ${duration}s`);
      
      res.json({
        message: 'Session ended successfully',
        duration,
        finalPosition: session.currentPosition
      });
    } catch (error) {
      logger.error('End session error:', error);
      res.status(500).json({
        error: 'Failed to end session',
        message: error.message
      });
    }
  },

  async heartbeat(req, res) {
    try {
      const { sessionId } = req.params;
      const { currentPosition, bufferHealth, networkSpeed, deviceInfo } = req.body;
      const userId = req.user.uid;
      
      const session = activeSessions.get(sessionId);
      
      if (!session) {
        return res.status(404).json({
          error: 'Session not found',
          message: 'Invalid session ID or session has expired'
        });
      }
      
      // Verify session belongs to the requesting user
      if (session.userId !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Session does not belong to this user'
        });
      }
      
      // Update session with heartbeat data
      session.lastHeartbeat = new Date();
      session.currentPosition = currentPosition || session.currentPosition;
      session.isActive = true;
      
      // Track additional metrics if provided
      if (bufferHealth !== undefined) {
        session.bufferHealth = bufferHealth;
      }
      
      if (networkSpeed !== undefined) {
        session.networkSpeed = networkSpeed;
      }
      
      if (deviceInfo) {
        session.deviceInfo = deviceInfo;
      }
      
      // Calculate watch time for this heartbeat interval
      const now = new Date();
      const lastUpdate = session.lastPositionUpdate || session.startTime;
      const timeDiff = Math.floor((now - lastUpdate) / 1000); // seconds
      
      session.totalWatchTime = (session.totalWatchTime || 0) + Math.min(timeDiff, 120); // Cap at 2 minutes
      session.lastPositionUpdate = now;
      
      activeSessions.set(sessionId, session);
      
      logger.info(`Heartbeat received for session: ${sessionId}, position: ${currentPosition}`);
      
      res.json({
        message: 'Heartbeat received successfully',
        sessionId: sessionId,
        serverTime: now.toISOString(),
        sessionActive: true,
        recommendedNextHeartbeat: 120 // 2 minutes in seconds
      });
    } catch (error) {
      logger.error('Heartbeat error:', error);
      res.status(500).json({
        error: 'Failed to process heartbeat',
        message: error.message
      });
    }
  },

  async getAnalytics(req, res) {
    try {
      const totalSessions = activeSessions.size;
      const sessionsByQuality = {};
      
      for (const session of activeSessions.values()) {
        sessionsByQuality[session.quality] = (sessionsByQuality[session.quality] || 0) + 1;
      }
      
      res.json({
        activeSessions: totalSessions,
        sessionsByQuality,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Get analytics error:', error);
      res.status(500).json({
        error: 'Failed to retrieve analytics',
        message: error.message
      });
    }
  }
};

module.exports = streamingController;
