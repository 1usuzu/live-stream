const http = require('http');
const logger = require('../utils/logger');

/**
 * Proxy FLV stream từ RTMP server
 * Frontend (HTTPS) -> Backend (HTTPS) -> RTMP Server (HTTP)
 */
exports.proxyStream = async (req, res) => {
  try {
    const { streamKey } = req.params;
    
    if (!streamKey) {
      return res.status(400).json({ error: 'Stream key là bắt buộc' });
    }

    const flvUrl = `${process.env.HLS_BASE_URL}/live/${streamKey}.flv`;
    
    logger.info(`Proxying stream: ${streamKey}`);

    // Parse URL
    const url = new URL(flvUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'Streemly-Backend/1.0'
      }
    };

    // Proxy request
    const proxyReq = http.request(options, (proxyRes) => {
      // Set headers
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': 'video/x-flv',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'keep-alive'
      });

      // Pipe stream
      proxyRes.pipe(res);

      proxyRes.on('error', (err) => {
        logger.error('Proxy response error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Lỗi khi stream video' });
        }
      });
    });

    proxyReq.on('error', (err) => {
      logger.error('Proxy request error:', err);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Không thể kết nối đến RTMP server' });
      }
    });

    // Handle client disconnect
    req.on('close', () => {
      proxyReq.destroy();
    });

    proxyReq.end();

  } catch (error) {
    logger.error('Stream proxy error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Lỗi hệ thống khi proxy stream' });
    }
  }
};

/**
 * Check stream status
 */
exports.checkStream = async (req, res) => {
  try {
    const { streamKey } = req.params;
    
    const flvUrl = `${process.env.HLS_BASE_URL}/live/${streamKey}.flv`;
    const url = new URL(flvUrl);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'HEAD',
      timeout: 5000
    };

    const checkReq = http.request(options, (checkRes) => {
      const isLive = checkRes.statusCode === 200;
      
      res.json({
        success: true,
        isLive,
        streamKey,
        statusCode: checkRes.statusCode
      });
    });

    checkReq.on('error', (err) => {
      res.json({
        success: true,
        isLive: false,
        streamKey,
        error: err.message
      });
    });

    checkReq.on('timeout', () => {
      checkReq.destroy();
      res.json({
        success: true,
        isLive: false,
        streamKey,
        error: 'Timeout'
      });
    });

    checkReq.end();

  } catch (error) {
    logger.error('Check stream error:', error);
    res.status(500).json({ error: 'Lỗi khi kiểm tra stream' });
  }
};
