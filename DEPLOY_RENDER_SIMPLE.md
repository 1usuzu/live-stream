# 🚀 Deploy lên Render.com - Hướng dẫn đơn giản

## Tổng quan
Deploy app **HOÀN TOÀN MIỄN PHÍ** lên Render.com + Supabase trong 30 phút.

---

## Bước 1: Chuẩn bị

### 1.1. Push code lên GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## Bước 2: Setup Database (Supabase)

### 2.1. Tạo tài khoản
1. Truy cập: https://supabase.com
2. Đăng nhập bằng GitHub
3. Click **New Project**

### 2.2. Tạo Database
- **Name**: `livestream-db`
- **Database Password**: Tạo password mạnh (lưu lại!)
- **Region**: Singapore
- **Plan**: Free

### 2.3. Lấy Connection String
1. **Settings** → **Database**
2. **Connection string** → **URI**
3. Copy connection string:
   ```
   postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```

---

## Bước 3: Deploy Backend

### 3.1. Tạo Web Service
1. Truy cập: https://render.com
2. Đăng nhập bằng GitHub
3. **New** → **Web Service**
4. Connect repository

### 3.2. Cấu hình

**Basic:**
- Name: `livestream-backend`
- Region: Singapore
- Branch: `main`
- Root Directory: `backend`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

**Environment Variables:**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=[paste Supabase connection string]
JWT_SECRET=[random string dài, vd: abc123xyz789...]
JWT_EXPIRE=7d
CLIENT_URL=https://livestream-frontend.onrender.com
```

**Tạo JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.3. Deploy & Run Migration

1. Click **Create Web Service**
2. Đợi deploy xong (có thể failed - bình thường)
3. Vào **Shell** tab
4. Chạy:
   ```bash
   npm run migrate
   ```
5. Đợi migration xong
6. **Manual Deploy** → **Deploy latest commit**

### 3.4. Lấy URL
Copy: `https://livestream-backend.onrender.com`

---

## Bước 4: Deploy RTMP Server

### 4.1. Tạo Service
1. **New** → **Web Service**
2. Connect repository

### 4.2. Cấu hình
- Name: `livestream-rtmp`
- Region: Singapore
- Branch: `main`
- Root Directory: `rtmp-server`
- Runtime: `Node`
- Build Command: `npm install`
- Start Command: `node server.js`

**Environment Variables:**
```
NODE_ENV=production
PORT=8000
```

### 4.3. Lấy URL
Copy: `https://livestream-rtmp.onrender.com`

---

## Bước 5: Deploy Frontend

### 5.1. Tạo Static Site
1. **New** → **Static Site`
2. Connect repository

### 5.2. Cấu hình
- Name: `livestream-frontend`
- Branch: `main`
- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `build`

**Environment Variables:**
```
REACT_APP_API_URL=https://livestream-backend.onrender.com
REACT_APP_SOCKET_URL=https://livestream-backend.onrender.com
REACT_APP_RTMP_URL=https://livestream-rtmp.onrender.com
```

### 5.3. Lấy URL
Copy: `https://livestream-frontend.onrender.com`

---

## Bước 6: Update Backend

Quay lại Backend service:
1. **Environment**
2. Sửa `CLIENT_URL`:
   ```
   CLIENT_URL=https://livestream-frontend.onrender.com
   ```
3. Save → Auto redeploy

---

## ✅ Hoàn thành!

Truy cập: `https://livestream-frontend.onrender.com`

---

## 🔧 Troubleshooting

### ❌ Build failed: "npm run migrate"

**Giải pháp:**
1. Bỏ `&& npm run migrate` khỏi Build Command
2. Deploy lại
3. Vào Shell chạy `npm run migrate`
4. Manual Deploy

### ❌ Migration failed

**Nếu lỗi "already exists":** Bình thường, bỏ qua.

**Nếu lỗi khác:**
```bash
# Trong Shell
echo $DATABASE_URL  # Kiểm tra connection string
npm run migrate     # Chạy lại
```

### ❌ Backend sleep sau 15 phút

**Giải pháp:** Dùng cron-job.org ping mỗi 10 phút:
- URL: `https://livestream-backend.onrender.com/api/health`
- Interval: Every 10 minutes

### ❌ Database connection error

Kiểm tra:
1. Connection string đúng format
2. Password không có ký tự đặc biệt
3. Supabase project active

### ❌ CORS error

Kiểm tra `CLIENT_URL` trong backend environment variables.

### ❌ RTMP không stream được

**Khuyến nghị:** Chạy RTMP local + ngrok

```bash
# Terminal 1
cd rtmp-server
node server.js

# Terminal 2
ngrok http 8000
```

Update `REACT_APP_RTMP_URL` với ngrok URL.

---

## 📊 Giới hạn Free Tier

| Service | Limit |
|---------|-------|
| Backend | Sleep sau 15 phút |
| Database | 500MB storage |
| Bandwidth | 100GB/tháng |
| Build time | 500 giờ/tháng |

**→ Đủ cho 100-200 users!**

---

## 💡 Tips

### 1. Prevent Sleep
Dùng UptimeRobot hoặc cron-job.org ping backend.

### 2. Optimize Database
```sql
-- Xóa data cũ
DELETE FROM messages WHERE created_at < NOW() - INTERVAL '7 days';
```

### 3. Monitor Logs
Render Dashboard → Service → Logs

### 4. Custom Domain (Optional)
Render Settings → Custom Domain → Add domain

---

## 🎉 Kết luận

Bạn đã deploy thành công app miễn phí!

**URLs:**
- Frontend: `https://livestream-frontend.onrender.com`
- Backend: `https://livestream-backend.onrender.com`
- RTMP: `https://livestream-rtmp.onrender.com`

**Next steps:**
- Test đăng ký/đăng nhập
- Test tạo room
- Test stream với OBS
- Chia sẻ với bạn bè!

---

**Thời gian:** ~30 phút  
**Chi phí:** $0/tháng  
**Độ khó:** ⭐⭐ (Dễ)

Good luck! 🚀
