const express = require('express');
const router = express.Router();
const streamProxyController = require('../controllers/streamProxyController');

// Proxy FLV stream
router.get('/live/:streamKey.flv', streamProxyController.proxyStream);

// Check stream status
router.get('/check/:streamKey', streamProxyController.checkStream);

module.exports = router;
