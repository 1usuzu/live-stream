# 🛠️ Scripts Helper

Các scripts hỗ trợ deployment và testing.

---

## 📋 Available Scripts

### 1. deploy-check.js
Kiểm tra project có sẵn sàng deploy không.

**Usage:**
```bash
node scripts/deploy-check.js
```

**Checks:**
- ✅ Git status
- ✅ Package.json files
- ✅ Environment files
- ✅ Database schema
- ✅ Migration scripts
- ✅ Dockerfiles
- ✅ .gitignore

**Output:**
- Errors: Phải fix trước khi deploy
- Warnings: Nên review nhưng không bắt buộc

---

### 2. test-production.js
Test production backend endpoints.

**Usage:**
```bash
node scripts/test-production.js https://your-backend.onrender.com
```

**Tests:**
- ✅ Health check endpoint
- ✅ CORS headers
- ✅ API routes
- ✅ Response time

**Example:**
```bash
node scripts/test-production.js https://livestream-backend.onrender.com
```

---

### 3. start-local.bat (Windows)
Start tất cả services local trong 1 click.

**Usage:**
```bash
scripts\start-local.bat
```

**Starts:**
- PostgreSQL + Redis (Docker)
- Backend (npm run dev)
- Frontend (npm start)
- RTMP Server (npm start)

**URLs:**
- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- RTMP: rtmp://localhost:1935/live

**Stop:**
Press any key trong terminal

---

## 🚀 Quick Commands

### Before Deploy
```bash
# Check readiness
node scripts/deploy-check.js
```

### After Deploy
```bash
# Test production
node scripts/test-production.js https://your-backend.onrender.com
```

### Local Development
```bash
# Start all services (Windows)
scripts\start-local.bat

# Or manual
docker-compose up postgres redis
cd backend && npm run dev
cd frontend && npm start
cd rtmp-server && npm start
```

---

## 📝 Notes

### deploy-check.js
- Chạy trước khi deploy
- Fix tất cả errors
- Review warnings
- Exit code 0 = ready, 1 = not ready

### test-production.js
- Chạy sau khi deploy
- Verify backend working
- Check CORS configured
- Monitor response time

### start-local.bat
- Windows only
- Requires Docker Desktop
- Opens 4 terminal windows
- Press any key to stop all

---

## 🆘 Troubleshooting

### deploy-check.js fails
```bash
# Read error messages
# Fix issues
# Re-run check
node scripts/deploy-check.js
```

### test-production.js fails
```bash
# Check backend URL correct
# Verify backend deployed
# Check Render logs
# Wait if backend sleeping (30s)
```

### start-local.bat fails
```bash
# Check Docker Desktop running
# Check ports not in use (3000, 3001, 1935)
# Check npm dependencies installed
```

---

## 💡 Tips

1. **Run deploy-check before every deploy**
2. **Run test-production after every deploy**
3. **Use start-local.bat for quick local start**
4. **Check script output carefully**
5. **Fix errors before proceeding**

---

**Happy scripting! 🎉**
