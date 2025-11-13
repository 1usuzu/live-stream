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
- Start Command: `node server.js`

**⚠️ Lưu ý:** Dùng `node server.js` thay vì `npm start` để tránh lỗi đường dẫn.

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

### 3.3. Deploy

Click **Create Web Service** → Đợi deploy xong

### 3.4. Chạy Migration từ Local

**Cách 1: Chạy từ máy local (Khuyến nghị)**

```bash
# Trong folder backend
cd backend

# Chạy migration với connection string
npm run migrate:remote "postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"

# Hoặc dùng environment variable
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres" npm run migrate:remote
```

**Cách 2: Thêm vào Build Command**

Quay lại Render Settings:
- Build Command: `npm install && npm run migrate || true`
- `|| true` để không fail nếu tables đã tồn tại

**Cách 3: Dùng Supabase SQL Editor**

1. Vào Supabase Dashboard
2. **SQL Editor** → **New query**
3. Copy nội dung file `backend/db/schema.sql`
4. Paste và **Run**

### 3.5. Lấy URL
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

**Giải pháp 1: Chạy migration từ local**
```bash
cd backend
DATABASE_URL="[Supabase connection string]" npm run migrate
```

**Giải pháp 2: Dùng Supabase SQL Editor**
1. Vào Supabase Dashboard
2. SQL Editor → New query
3. Copy nội dung `backend/db/schema.sql`
4. Run

**Giải pháp 3: Thêm `|| true` vào Build Command**
```
npm install && npm run migrate || true
```

### ❌ Migration failed: "already exists"

**Bình thường!** Tables đã tồn tại. Bỏ qua lỗi này.

### ❌ Cannot access Shell (Free tier)

**Không sao!** Chạy migration từ local hoặc dùng Supabase SQL Editor (xem trên).

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

**Nguyên nhân:** Backend không cho phép frontend origin.

**Giải pháp:**

1. **Kiểm tra CLIENT_URL:**
   - Vào Backend service → Environment
   - `CLIENT_URL` phải là: `https://livestream-frontend.onrender.com`
   - Không có dấu `/` ở cuối

2. **Nếu vẫn lỗi, set CLIENT_URL = *:**
   ```
   CLIENT_URL=*
   ```
   (Cho phép tất cả origins - chỉ dùng khi test)

3. **Redeploy backend:**
   - Manual Deploy → Deploy latest commit

4. **Clear browser cache:**
   - Ctrl + Shift + R (Windows)
   - Cmd + Shift + R (Mac)

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
