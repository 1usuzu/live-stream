# Architecture Overview

## System Architecture

### Production Setup (Render + AWS EC2)

```
                    ┌─────────────────────┐
                    │   OBS Studio        │
                    │   Stream Key: UUID  │
                    └──────────┬──────────┘
                               │ RTMP
                               ▼
                    ┌─────────────────────┐
                    │  RTMP Server (EC2)  │
                    │  13.210.237.197     │
                    │  Port: 1935, 8000   │
                    └──────────┬──────────┘
                               │ HTTP-FLV
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│              (React - Render Static Site)                   │
│              https://streair.onrender.com                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Pages      │  │  Components  │  │    Hooks     │       │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤       │
│  │ - Login      │  │ - Navbar     │  │ - useAuth    │       │  
│  │ - Register   │  │ - ChatBox    │  │ - useChat    │       │
│  │ - Welcome    │  │ - FlvPlayer  │  └──────────────┘       │
│  │ - Streamer   │  │ - Toast      │                         │
│  │ - Viewer     │  │ - Protected  │                         │
│  └──────────────┘  └──────────────┘                         │
│                                                             │
│  ┌──────────────────────────────────────────────────┐       │
│  │              Services (api.js)                   │       │
│  │  - authAPI  - roomsAPI  - usersAPI  - streamsAPI │       │
│  └──────────────────────────────────────────────────┘       │
│                                                             │
└──────────────────┬──────────────────┬───────────────────────┘
                   │                  │
                   │ HTTP/REST        │ WebSocket
                   │ (JWT Auth)       │ (Socket.io)
                   ▼                  ▼
┌────────────────────────────────────────────────────────────┐
│                         BACKEND                            │
│                  (Node.js/Express - Port 3000)             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Routes         │  │ Controllers  │  │  Middleware  │  │
│  ├──────────────────┤  ├──────────────┤  ├──────────────┤  │
│  │ /api/auth        │  │ authCtrl     │  │ - auth       │  │
│  │ /api/rooms       │  │ roomCtrl     │  │ - validation │  │
│  │ /api/users       │  │ userCtrl     │  │ - rateLimit  │  │
│  │ /api/streams     │  │ streamCtrl   │  │ - error      │  │
│  │ /api/stream-proxy│  │ proxyCtrl    │  │ - ipWhitelist│  │
│  └──────────────────┘  └──────────────┘  └──────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────┐      │
│  │              Socket.io Manager                   │      │
│  │  - roomHandlers  - chatHandlers  - webrtcHandlers│      │
│  └──────────────────────────────────────────────────┘      │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Models     │  │    Config    │  │    Utils     │      │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤      │
│  │ - User       │  │ - database   │  │ - logger     │      │
│  │ - Room       │  │ - redis      │  │ - helpers    │      │
│  │ - Message    │  │ - mediasoup  │  │ - constants  │      │
│  │ - Follow     │  └──────────────┘  └──────────────┘      │
│  └──────────────┘                                          │
│                                                            │
└──────────────┬──────────────────┬──────────────────────────┘
               │                  │
               ▼                  ▼
┌──────────────────────┐  ┌──────────────────────┐
│    PostgreSQL        │  │       Redis          │
│    (Port 5432)       │  │    (Port 6379)       │
├──────────────────────┤  ├──────────────────────┤
│ Tables:              │  │ Cache:               │
│ - users              │  │ - online_users       │
│ - rooms              │  │ - live_rooms         │
│ - messages           │  │ - room_stats         │
│ - follows            │  │ - rate_limits        │
│ - bans               │  └──────────────────────┘
└──────────────────────┘
```

## Data Flow

### 1. Authentication Flow

```
User Input (email, password)
    ↓
Frontend (useAuth)
    ↓
POST /api/auth/login
    ↓
Backend (authController)
    ↓
Database (User.findByEmail)
    ↓
JWT Token Generation
    ↓
Response (token + user)
    ↓
Frontend (localStorage)
    ↓
Authenticated State
```

### 2. Room Creation Flow

```
Streamer Input (title, description, category)
    ↓
Frontend (StreamerDashboard)
    ↓
POST /api/rooms
    ↓
Backend (roomController)
    ↓
Database (Room.create)
    ↓
Redis (cache live_rooms)
    ↓
Response (room data)
    ↓
Frontend (display room info)
    ↓
Socket.io (create-room event)
    ↓
Room initialized in memory
```

### 3. Chat Flow

```
User types message
    ↓
Frontend (ChatBox)
    ↓
Socket.io emit (chat-message)
    ↓
Backend (chatHandlers)
    ↓
Validation & Rate Limiting
    ↓
Database (Message.create)
    ↓
Socket.io broadcast (new-message)
    ↓
All clients in room receive
    ↓
Frontend updates chat UI
```

### 4. Video Streaming Flow (FLV via Backend Proxy)

```
OBS Studio
    ↓
RTMP: rtmp://13.210.237.197/live
Stream Key: UUID (e.g., 63df1f1f56c6c7215813d55137c04825)
    ↓
RTMP Server (AWS EC2)
    ↓
Convert RTMP → FLV (Port 8000)
    ↓
Frontend (HTTPS) requests video
    ↓
GET /api/stream-proxy/live/{UUID}.flv
    ↓
Backend Proxy (HTTPS)
    ↓
Fetch from: http://13.210.237.197:8000/live/{UUID}.flv
    ↓
Stream data back to Frontend (HTTPS)
    ↓
FlvPlayer (flv.js) decodes
    ↓
Video playback (độ trễ 2-3 giây)
```

**Lý do dùng Backend Proxy:**

- Fix Mixed Content (HTTPS frontend → HTTP RTMP)
- Thêm authentication layer
- Rate limiting cho video requests
- Logging & monitoring
- CORS handling

## Security Layers

### 1. Authentication

- JWT tokens with expiration
- Password hashing (bcrypt)
- Token validation middleware

### 2. Authorization

- Protected routes
- Room ownership verification
- Streamer-only actions

### 3. Rate Limiting

- API rate limits (300 req/15min)
- Chat rate limits (5 msg/10sec)
- Socket connection limits (10/min per IP)
- Stream proxy rate limits (100 req/min per IP)

### 4. Input Validation

- Joi schema validation
- XSS prevention
- SQL injection prevention (parameterized queries)

### 5. CORS

- Whitelist CLIENT_URL
- Credentials support
- Specific methods allowed

## 📊 Database Schema

### Users Table

```sql
users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  stream_key VARCHAR(255) UNIQUE,
  display_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  is_streaming BOOLEAN,
  follower_count INTEGER,
  created_at TIMESTAMP,
  last_login TIMESTAMP
)
```

### Rooms Table

```sql
rooms (
  id SERIAL PRIMARY KEY,
  room_id VARCHAR(255) UNIQUE,
  streamer_id INTEGER REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(50),
  is_live BOOLEAN,
  viewer_count INTEGER,
  started_at TIMESTAMP,
  ended_at TIMESTAMP
)
```

### Messages Table

```sql
messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER REFERENCES rooms(id),
  user_id INTEGER REFERENCES users(id),
  username VARCHAR(50),
  content TEXT,
  is_deleted BOOLEAN,
  created_at TIMESTAMP
)
```

### Follows Table

```sql
follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER REFERENCES users(id),
  following_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP,
  UNIQUE(follower_id, following_id)
)
```

## Socket.io Events

### Client → Server

| Event            | Data            | Description        |
| ---------------- | --------------- | ------------------ |
| `create-room`    | `{ roomId }`    | Streamer tạo phòng |
| `join-room`      | `{ roomId }`    | Viewer tham gia    |
| `leave-room`     | -               | Rời phòng          |
| `chat-message`   | `{ message }`   | Gửi tin nhắn       |
| `delete-message` | `{ messageId }` | Xóa tin nhắn       |
| `clear-chat`     | -               | Xóa toàn bộ chat   |

### Server → Client

| Event             | Data                                           | Description     |
| ----------------- | ---------------------------------------------- | --------------- |
| `new-message`     | `{ id, userId, username, message, timestamp }` | Tin nhắn mới    |
| `viewer-joined`   | `{ userId, username, viewerCount }`            | Viewer mới      |
| `viewer-left`     | `{ userId, username, viewerCount }`            | Viewer rời      |
| `stream-ended`    | `{ reason }`                                   | Stream kết thúc |
| `message-deleted` | `{ messageId }`                                | Tin nhắn bị xóa |
| `chat-cleared`    | -                                              | Chat bị xóa     |

## Performance Optimizations

### Frontend

- React.memo for components
- useCallback for event handlers
- Lazy loading for routes
- HLS low latency mode
- Debounced search

### Backend

- Redis caching for live rooms
- Connection pooling (PostgreSQL)
- Compression middleware
- Rate limiting
- Efficient database queries

### Database

- Indexes on frequently queried columns
- Soft deletes for messages
- Cleanup jobs for old data

## Scalability Considerations

### Horizontal Scaling

- Stateless API servers
- Redis for shared state
- Socket.io with Redis adapter
- Load balancer ready

### Vertical Scaling

- Connection pooling
- Query optimization
- Caching strategy
- CDN for static assets

## Monitoring & Logging

### Winston Logger

- Info, warn, error levels
- File rotation
- Console output (dev)
- Structured logging

### Health Checks

- `/health` endpoint
- Database connection status
- Redis connection status
- Uptime tracking

### Metrics Tracked

- Active streams count
- Total viewers
- Chat messages per minute
- API response times
- Error rates
- Stream proxy bandwidth usage

## Development Tools

### Backend

- nodemon (auto-restart)
- winston (logging)
- joi (validation)
- helmet (security)
- express-rate-limit (rate limiting)
- socket.io (real-time)
- pg (PostgreSQL client)
- ioredis (Redis client)

### Frontend

- React 18
- React Router v6
- Vite (build tool)
- flv.js (FLV player)
- socket.io-client
- axios (HTTP client)
- Tailwind CSS (styling)

### DevOps

- Git (version control)
- Render (hosting)
- AWS EC2 (RTMP server)
- PostgreSQL (database)
- Redis (cache)

## Deployment Architecture

### Current Setup (v1.0)

```
┌─────────────────────────────────────────┐
│         Frontend (Render Static)        │
│      https://streair.onrender.com       │
└─────────────────────────────────────────┘
                    │
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────┐
│         Backend (Render Web Service)    │
│      https://streair-api.onrender.com   │
│              Port: 3000                 │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────────┐  ┌────▼──────────┐
│ PostgreSQL │  │ RTMP Server   │
│  (Render)  │  │  (AWS EC2)    │
│ Port: 5432 │  │ 13.210.237.197│
└────────────┘  └───────────────┘
```

### Future Scalability (v2.0+)

```
┌─────────────────────────────────────────┐
│           Load Balancer (Nginx)         │
└────────────┬────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼────┐      ┌────▼───┐
│ App 1  │      │ App 2  │  (Multiple instances)
└───┬────┘      └────┬───┘
    │                │
    └────────┬───────┘
             │
    ┌────────▼────────┐
    │  Redis Cluster  │  (Shared state)
    └─────────────────┘
             │
    ┌────────▼────────┐
    │   PostgreSQL    │  (Primary + Replicas)
    └─────────────────┘
```

## Technical Stack Summary

| Layer          | Technology                    | Purpose               |
| -------------- | ----------------------------- | --------------------- |
| Frontend       | React 18 + Vite               | UI Framework          |
| Styling        | Tailwind CSS                  | Responsive Design     |
| Video Player   | flv.js                        | FLV Streaming         |
| Real-time      | Socket.io Client              | Chat & Events         |
| HTTP Client    | Axios                         | API Requests          |
| Backend        | Node.js + Express             | API Server            |
| Real-time      | Socket.io Server              | WebSocket Management  |
| Database       | PostgreSQL                    | Persistent Data       |
| Cache          | Redis                         | Session & Live Data   |
| Authentication | JWT (jsonwebtoken)            | Stateless Auth        |
| Validation     | Joi                           | Input Validation      |
| Security       | Helmet + CORS + Rate Limiting | Protection            |
| Logging        | Winston                       | Application Logs      |
| RTMP Server    | Node-Media-Server (AWS EC2)   | RTMP → FLV Conversion |
| Hosting        | Render (Frontend + Backend)   | Cloud Platform        |
| Video Hosting  | AWS EC2                       | RTMP Server           |
| CI/CD          | Git + Render Auto-Deploy      | Continuous Deployment |

---

**Architecture Type:** Monolithic with microservices-ready structure  
**Communication:** REST API + WebSocket (Socket.io)  
**Database:** PostgreSQL (Relational)  
**Cache:** Redis (In-memory)  
**Real-time:** Socket.io  
**Video:** FLV (HTTP-FLV via Backend Proxy)  
**RTMP Server:** External (13.210.237.197:1935)  
**Deployment:** Render (Backend + Frontend), AWS EC2 (RTMP)

---

### Architecture Principles

**Scalability** - Stateless design, Redis for shared state  
**Real-time Performance** - Socket.io for instant updates  
**Security** - JWT, rate limiting, input validation  
**Maintainability** - Clean code structure, logging  
**Extensibility** - Modular design, easy to add features  
**Low Latency** - FLV streaming (2-3s delay)  
**Mobile-First** - Responsive design for all devices

## Environment Variables

### Backend (.env)

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_URL=redis://host:6379

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=https://streair.onrender.com

# RTMP Server
RTMP_SERVER_URL=http://13.210.237.197:8000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=300
```

### Frontend (.env.production)

```bash
VITE_API_URL=https://streair-api.onrender.com
VITE_SOCKET_URL=https://streair-api.onrender.com
VITE_RTMP_SERVER=rtmp://13.210.237.197/live
VITE_RTMP_PORT=1935
```

## Troubleshooting Guide

### Common Issues

#### 1. Stream không hiển thị

**Triệu chứng:** Video player hiển thị "CHỜ STREAM" mặc dù đã stream từ OBS

**Giải pháp:**

- Kiểm tra OBS đã connect thành công chưa (màu xanh)
- Verify RTMP URL: `rtmp://13.210.237.197/live`
- Verify Stream Key đúng với UUID trong database
- Check RTMP server logs: `ssh ec2-user@13.210.237.197`
- Test FLV endpoint: `http://13.210.237.197:8000/live/{UUID}.flv`

#### 2. Mixed Content Error

**Triệu chứng:** Console error "Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure resource"

**Giải pháp:**

- Đã fix bằng Backend Proxy
- Frontend request qua `/api/stream-proxy` (HTTPS)
- Backend fetch từ RTMP server (HTTP)

#### 3. Socket.io không connect

**Triệu chứng:** Chat không hoạt động, không thấy viewers

**Giải pháp:**

- Check CORS settings trong backend
- Verify `VITE_SOCKET_URL` trong frontend
- Check browser console for WebSocket errors
- Ensure backend is running

#### 4. JWT Token expired

**Triệu chứng:** Bị logout tự động, API trả về 401

**Giải pháp:**

- Token expires sau 7 ngày (default)
- User cần login lại
- Implement refresh token (future feature)

#### 5. Rate Limit exceeded

**Triệu chứng:** API trả về 429 "Too Many Requests"

**Giải pháp:**

- Đợi 15 phút để reset
- Tăng `RATE_LIMIT_MAX_REQUESTS` nếu cần
- Implement user-based rate limiting (future)

#### 6. Database connection failed

**Triệu chứng:** Backend crash, "ECONNREFUSED" error

**Giải pháp:**

- Check `DATABASE_URL` đúng chưa
- Verify PostgreSQL đang chạy
- Check network/firewall settings
- Restart database service

#### 7. Redis connection failed

**Triệu chứng:** Backend chạy nhưng không cache được

**Giải pháp:**

- Check `REDIS_URL` đúng chưa
- Verify Redis đang chạy
- Backend vẫn hoạt động (graceful degradation)

### Performance Issues

#### High Latency (>5s)

**Nguyên nhân:**

- Network congestion
- RTMP server overload
- Too many viewers

**Giải pháp:**

- Optimize OBS settings (lower bitrate)
- Use CDN for video delivery (future)
- Implement adaptive bitrate streaming

#### Chat lag

**Nguyên nhân:**

- Too many messages
- Socket.io overload

**Giải pháp:**

- Implement message throttling
- Use Redis pub/sub for scaling
- Add slow mode

## Implemented Features (v1.0)

- JWT Authentication với tiếng Việt error messages
- Stream qua Backend Proxy (fix Mixed Content HTTPS→HTTP)
- FLV streaming với độ trễ thấp (2-3s)
- Real-time chat với Socket.io
- Stream status checking (ĐANG TRỰC TIẾP / CHỜ STREAM)
- Mobile responsive UI (375px, 640px, 768px breakpoints)
- Dark/Light theme
- Rate limiting tăng cường (300 req/15min)
- Copy to clipboard cho RTMP URL & Stream Key
- End stream functionality
- Toast notifications
- SPA routing với \_redirects (fix 404 on refresh)
- Dynamic stream keys (UUID per user)

## Testing Strategy

### Unit Tests (Future)

```javascript
// Example: authController.test.js
describe("Auth Controller", () => {
  test("should register new user", async () => {
    // Test implementation
  });

  test("should login with valid credentials", async () => {
    // Test implementation
  });

  test("should reject invalid email", async () => {
    // Test implementation
  });
});
```

### Integration Tests (Future)

- API endpoint testing
- Database operations
- Socket.io events
- Stream proxy functionality

### E2E Tests (Future)

- User registration flow
- Stream creation flow
- Chat functionality
- Video playback

### Manual Testing Checklist

- [ ] Register new account
- [ ] Login with credentials
- [ ] Create stream room
- [ ] Copy RTMP URL & Stream Key
- [ ] Start OBS stream
- [ ] Verify video playback
- [ ] Send chat messages
- [ ] Join as viewer
- [ ] End stream
- [ ] Logout

## API Documentation

### Authentication Endpoints

#### POST /api/auth/register

**Request:**

```json
{
  "username": "streamer123",
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "streamer123",
    "email": "user@example.com",
    "streamKey": "63df1f1f56c6c7215813d55137c04825"
  }
}
```

#### POST /api/auth/login

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "streamer123",
    "email": "user@example.com",
    "streamKey": "63df1f1f56c6c7215813d55137c04825",
    "isStreaming": false
  }
}
```

### Room Endpoints

#### POST /api/rooms

**Headers:**

```
Authorization: Bearer {token}
```

**Request:**

```json
{
  "title": "Gaming Stream",
  "description": "Playing Valorant",
  "category": "Gaming"
}
```

**Response:**

```json
{
  "id": 1,
  "roomId": "room-123",
  "streamerId": 1,
  "title": "Gaming Stream",
  "description": "Playing Valorant",
  "category": "Gaming",
  "isLive": false,
  "viewerCount": 0,
  "startedAt": null
}
```

#### GET /api/rooms

**Response:**

```json
[
  {
    "id": 1,
    "roomId": "room-123",
    "title": "Gaming Stream",
    "streamerUsername": "streamer123",
    "isLive": true,
    "viewerCount": 42,
    "category": "Gaming"
  }
]
```

#### GET /api/rooms/:roomId

**Response:**

```json
{
  "id": 1,
  "roomId": "room-123",
  "title": "Gaming Stream",
  "description": "Playing Valorant",
  "category": "Gaming",
  "isLive": true,
  "viewerCount": 42,
  "streamer": {
    "id": 1,
    "username": "streamer123",
    "displayName": "Streamer 123",
    "avatarUrl": null
  }
}
```

#### DELETE /api/rooms/:roomId

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "message": "Đã kết thúc stream"
}
```

### Stream Endpoints

#### GET /api/streams/check/:streamKey

**Response:**

```json
{
  "isLive": true,
  "streamKey": "63df1f1f56c6c7215813d55137c04825"
}
```

#### GET /api/stream-proxy/live/:streamKey.flv

**Description:** Proxy FLV stream from RTMP server

**Response:** Binary video stream (FLV format)

**Headers:**

```
Content-Type: video/x-flv
Cache-Control: no-cache
```

### User Endpoints

#### GET /api/users/me

**Headers:**

```
Authorization: Bearer {token}
```

**Response:**

```json
{
  "id": 1,
  "username": "streamer123",
  "email": "user@example.com",
  "displayName": "Streamer 123",
  "avatarUrl": null,
  "bio": null,
  "streamKey": "63df1f1f56c6c7215813d55137c04825",
  "isStreaming": true,
  "followerCount": 0
}
```

### Socket.io Events

#### Client → Server

```javascript
// Join room
socket.emit("join-room", { roomId: "room-123" });

// Send chat message
socket.emit("chat-message", { message: "Hello!" });

// Leave room
socket.emit("leave-room");
```

#### Server → Client

```javascript
// New message
socket.on("new-message", (data) => {
  console.log(data);
  // { id, userId, username, message, timestamp }
});

// Viewer joined
socket.on("viewer-joined", (data) => {
  console.log(data);
  // { userId, username, viewerCount }
});

// Stream ended
socket.on("stream-ended", (data) => {
  console.log(data);
  // { reason: 'Streamer ended the stream' }
});
```

## Roadmap

### v1.1 (Next Sprint)

- [ ] Follow/Unfollow users
- [ ] User profiles with stats
- [ ] Stream thumbnails (auto-capture)
- [ ] Push notifications
- [ ] Emojis/Reactions in chat
- [ ] Stream recording (save to S3)
- [ ] Search & filter streams
- [ ] Stream categories

### v1.2 (Q1 2026)

- [ ] WebRTC support (lower latency <1s)
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard (views, chat activity)
- [ ] Multi-quality streaming (360p, 720p, 1080p)
- [ ] Moderator roles & permissions
- [ ] Ban/timeout users
- [ ] Slow mode chat
- [ ] Subscriber-only chat

### v2.0 (Q2 2026)

- [ ] Multi-streaming (stream to Twitch, YouTube, Facebook)
- [ ] Monetization (donations, subscriptions, ads)
- [ ] VOD (Video on Demand)
- [ ] Clips & Highlights
- [ ] Stream scheduling
- [ ] Collaborative streaming (co-hosts)
- [ ] Virtual gifts & badges
- [ ] Leaderboards

### v3.0 (Future)

- [ ] AI-powered moderation
- [ ] Auto-generated highlights
- [ ] Stream overlays & widgets
- [ ] Third-party integrations (Discord, Spotify)
- [ ] Advanced analytics (heatmaps, retention)
- [ ] White-label solution

## Best Practices

### Code Style

- **JavaScript:** ES6+ syntax, async/await over promises
- **React:** Functional components with hooks
- **Naming:** camelCase for variables, PascalCase for components
- **Files:** kebab-case for filenames
- **Comments:** JSDoc for functions, inline for complex logic

### Security

- Never commit `.env` files
- Always validate user input
- Use parameterized queries (prevent SQL injection)
- Sanitize HTML content (prevent XSS)
- Implement rate limiting on all endpoints
- Use HTTPS in production
- Rotate JWT secrets regularly

### Performance

- Use React.memo for expensive components
- Implement pagination for large lists
- Cache frequently accessed data in Redis
- Optimize database queries with indexes
- Use CDN for static assets
- Compress API responses
- Lazy load routes and components

### Database

- Use transactions for multi-step operations
- Implement soft deletes for important data
- Regular backups (daily recommended)
- Monitor query performance
- Use connection pooling
- Index foreign keys

### Git Workflow

```bash
# Feature branch
git checkout -b feature/new-feature

# Commit with meaningful messages
git commit -m "feat: add user profile page"

# Push and create PR
git push origin feature/new-feature
```

### Commit Message Convention

```
feat: new feature
fix: bug fix
docs: documentation
style: formatting
refactor: code restructuring
test: adding tests
chore: maintenance
```

## Contributing Guide

### Setup Development Environment

1. **Clone repository**

```bash
git clone https://github.com/yourusername/livestream-app.git
cd livestream-app
```

2. **Install dependencies**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Setup environment variables**

```bash
# Backend
cp .env.example .env
# Edit .env with your values

# Frontend
cp .env.example .env.development
# Edit .env.development with your values
```

4. **Setup database**

```bash
# Create PostgreSQL database
createdb livestream_dev

# Run migrations (if available)
npm run migrate
```

5. **Start development servers**

```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

### Making Changes

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Commit with meaningful messages
5. Push and create Pull Request
6. Wait for code review

### Code Review Checklist

- [ ] Code follows style guide
- [ ] No console.log in production code
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Security considerations addressed
- [ ] Performance optimized
- [ ] Documentation updated
- [ ] Tests added (if applicable)

## Support & Contact

### Issues

Report bugs or request features on GitHub Issues:

- Bug reports: Include steps to reproduce
- Feature requests: Describe use case and benefits

### Documentation

- Architecture: `ARCHITECTURE.md` (this file)
- API Docs: See API Documentation section above
- Setup Guide: `README.md`

### Resources

- **React:** https://react.dev
- **Express:** https://expressjs.com
- **Socket.io:** https://socket.io
- **PostgreSQL:** https://postgresql.org
- **Redis:** https://redis.io
- **flv.js:** https://github.com/bilibili/flv.js

---

**Last Updated:** November 15, 2025  
**Version:** 1.0  
**Maintainer:** Your Team  
**License:** MIT

---

🎉 **Happy Streaming!** 🎉
