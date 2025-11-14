require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const helmet = require('helmet')
const compression = require('compression')
const SocketManager = require('./src/socket')
const logger = require('./src/utils/logger')
const errorHandler = require('./src/middleware/errorHandler')

// Validate environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL']
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '))
  console.error('Please create a .env file based on .env.example')
  process.exit(1)
}

// Initialize Express
const app = express()
const server = http.createServer(app)

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`)
    } else {
      next()
    }
  })
}

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}))

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://streami-kx3p.onrender.com'
]

// Add CLIENT_URL from env if exists
if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL)
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}

app.use(cors(corsOptions))

// Body Parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression
app.use(compression())

// Request Logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`)
    next()
  })
}

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'checking...',
    redis: 'checking...'
  })
})

// API Routes
app.use('/api/auth', require('./src/routes/auth'))
app.use('/api/rooms', require('./src/routes/rooms'))
app.use('/api/users', require('./src/routes/users'))
app.use('/api/streams', require('./src/routes/streams'))
app.use('/api/stream-proxy', require('./src/routes/streamProxy'))

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error Handler
app.use(errorHandler)

// Test database connection before starting server
const testDatabaseConnection = async () => {
  const db = require('./src/config/database')
  try {
    await db.query('SELECT NOW()')
    console.log('✅ Database connection successful')
    logger.info('Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed!')
    console.error('Error:', error.message)
    console.error('Code:', error.code)

    if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 PostgreSQL is not running!')
      console.error('Please start PostgreSQL:')
      console.error('  - Windows: Start "PostgreSQL" service')
      console.error('  - Mac: brew services start postgresql')
      console.error('  - Linux: sudo systemctl start postgresql')
    }

    console.error('\n📝 Current DATABASE_URL:', process.env.DATABASE_URL || 'NOT SET')
    console.error('\nExpected format:')
    console.error('  postgresql://username:password@localhost:5432/database_name')

    logger.error('Database connection failed:', error.message)
    return false
  }
}

// Start Server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection()

    if (!dbConnected) {
      logger.warn('Server starting without database connection')
      logger.warn('Some features will not work until database is connected')
    }

    // Initialize Socket.io
    const socketManager = new SocketManager(server)
    logger.info('Socket.io initialized')

    // Start server
    const PORT = process.env.PORT || 3000
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
      logger.info(`CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)

      if (process.env.NODE_ENV === 'development') {
        logger.info(`\nAPI Documentation: http://localhost:${PORT}/health`)
        logger.info(`Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`)
      }
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful Shutdown
const gracefulShutdown = async () => {
  logger.info('Received shutdown signal, closing server gracefully...')

  server.close(async () => {
    logger.info('HTTP server closed')

    try {
      // Close database connections
      const db = require('./src/config/database')
      await db.pool.end()
      logger.info('Database pool closed')

      // Close Redis connection
      const { redis } = require('./src/config/redis')
      await redis.quit()
      logger.info('Redis connection closed')

      process.exit(0)
    } catch (error) {
      logger.error('Error during shutdown:', error)
      process.exit(1)
    }
  })

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)

// Handle Uncaught Exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Start the server
startServer()

module.exports = { app, server }