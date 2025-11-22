const express = require('express');
const router = express.Router();
const streamController = require('../controllers/streamController');
const authMiddleware = require('../middleware/auth');
const { rateLimitByIP, checkStreamerIP } = require('../middleware/ipWhitelist');

// Public routes
router.get('/:roomId/stats', streamController.getStreamStats);
router.get('/:roomId/messages', streamController.getStreamMessages);

// Stream token generation (protected, rate limited - TEMPORARILY DISABLED)
router.get(
    '/:roomId/token',
    authMiddleware,
    // rateLimitByIP(10, 60000), // 10 requests per minute
    streamController.getStreamToken
);

// Token verification (for RTMP/HLS server)
router.get('/verify-token', streamController.verifyStreamToken);

// Protected routes (streamer only)
router.post(
    '/:roomId/ban/:userId',
    authMiddleware,
    checkStreamerIP,
    streamController.banUser
);

router.delete(
    '/:roomId/ban/:userId',
    authMiddleware,
    checkStreamerIP,
    streamController.unbanUser
);

router.get('/:roomId/bans', authMiddleware, streamController.getBannedUsers);

module.exports = router;