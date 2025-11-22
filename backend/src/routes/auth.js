const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validateRegister, validateLogin, validateUpdateProfile } = require('../middleware/validation');
const { rateLimitByIP } = require('../middleware/ipWhitelist');

// Public routes with strict rate limiting (TEMPORARILY DISABLED)
router.post(
    '/register',
    // rateLimitByIP(5, 3600000), // 5 registrations per hour per IP
    validateRegister,
    authController.register
);

router.post(
    '/login',
    // rateLimitByIP(10, 900000), // 10 login attempts per 15 minutes per IP
    validateLogin,
    authController.login
);

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validateUpdateProfile, authController.updateProfile);
router.post('/refresh', authMiddleware, authController.refreshToken);
router.put(
    '/password',
    authMiddleware,
    // rateLimitByIP(3, 3600000), // 3 password changes per hour
    authController.changePassword
);

module.exports = router;