
const logger = require('../../shared/utils/logger');
const awsService = require('../content/services/awsService');

// In-memory session storage (use Redis in production)
const activeSessions = new Map();

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
        streamingUrl
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
