# 🆓 Deploy Streemly HOÀN TOÀN MIỄN PHÍ

## Tổng quan
Hướng dẫn này sẽ giúp bạn deploy app **100% FREE** với các dịch vụ cloud miễn phí.

**Không cần:**
- ❌ VPS/Server riêng
- ❌ Trả tiền hàng tháng
- ❌ Credit card (hầu hết)
- ❌ Kiến thức Linux/DevOps phức tạp

**Chỉ cần:**
- ✅ Tài khoản GitHub
- ✅ Email
- ✅ 30 phút setup

---

## 🎯 Phương án khuyến nghị: Render.com + Supabase

### Tại sao chọn phương án này?
- ✅ **100% Free** (không cần credit card)
- ✅ **Dễ setup** (chỉ cần click)
- ✅ **Auto deploy** từ GitHub
- ✅ **SSL miễn phí**
- ✅ **PostgreSQL miễn phí** (Supabase)
- ✅ **Đủ cho 100-200 users đồng thời**

### Giới hạn Free Tier
- Backend: Sleep sau 15 phút không dùng (khởi động lại ~30s)
- Database: 500MB storage, 2GB bandwidth/tháng
- Bandwidth: 100GB/tháng
- Build time: 500 giờ/tháng

**→ Đủ để chạy và demo, có thể có vài trăm users!**

---

## 📝 Bước 1: Chuẩn bị Code

### 1.1. Push code lên GitHub

```bash
# Tạo repo mới trên GitHub (nếu chưa có)
# Sau đó:

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/1usuzu/live-stream.git
git push -u origin main
```

### 1.2. Cập nhật file package.json

Đảm bảo backend có script migrate:

```json
// backend/package.json
{
  "scripts": {
    "start": "node server.js",
    "migrate": "node migrations/run.js"
  }
}
```

---

## 🗄️ Bước 2: Setup Database (Supabase - FREE)

### 2.1. Tạo tài khoản Supabase

1. Truy cập: https://supabase.com
2. Click **Start your project**
3. Đăng nhập bằng GitHub
4. **KHÔNG CẦN CREDIT CARD!**

### 2.2. Tạo Project

1. Click **New Project**
2. Điền thông tin:
   - **Name**: `livestream-db`
   - **Database Password**: Tạo password mạnh (lưu lại!)
   - **Region**: Singapore (gần VN nhất)
   - **Pricing Plan**: Free
3. Click **Create new project** (chờ ~2 phút)

### 2.3. Lấy Connection String

1. Vào **Settings** → **Database**
2. Tìm **Connection string** → **URI**
3. Copy connection string, format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
4. **LƯU LẠI** connection string này!

### 2.4. Chạy Migration (Optional - có thể làm sau)

Bạn có thể chạy migration từ máy local:

```bash
cd backend

# Tạo file .env tạm
echo "DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres" > .env

# Chạy migration
npm run migrate
```

Hoặc để Render tự chạy khi deploy (khuyến nghị).
  
---

## 🚀 Bước 3: Deploy Backend (Render.com - FREE)

### 3.1. Tạo tài khoản Render

1. Truy cập: https://render.com
2. Click **Get Started**
3. Đăng nhập bằng GitHub
4. **KHÔNG CẦN CREDIT CARD!**

### 3.2. Connect GitHub Repository

1. Click **New** → **Web Service**
2. Click **Connect account** (nếu chưa connect)
3. Chọn repository `livestream-app`
4. Click **Connect**

### 3.3. Cấu hình Backend Service

Điền thông tin:

**Basic:**
- **Name**: `livestream-backend`
- **Region**: Singapore
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: 
  ```
  npm install && npm run migrate
  ```
- **Start Command**: 
  ```
  npm start
  ```

**Instance Type:**
- Chọn **Free**

**Environment Variables** (Click **Add Environment Variable**):

```
NODE_ENV=production
PORT=3000
DATABASE_URL=[paste Supabase connection string]
JWT_SECRET=[tạo random string dài, vd: abc123xyz789...]
JWT_EXPIRE=7d
CLIENT_URL=https://livestream-frontend.onrender.com
```

**Tạo JWT_SECRET ngẫu nhiên:**
```bash
# Trên máy local, chạy:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Click **Create Web Service** → Chờ ~5 phút deploy

### 3.4. Lấy Backend URL

Sau khi deploy xong, copy URL:
```
https://livestream-backend.onrender.com
```

---

## 📡 Bước 4: Deploy RTMP Server (Render.com - FREE)

### 4.1. Tạo RTMP Service

1. Click **New** → **Web Service**
2. Chọn repository `livestream-app`
3. Click **Connect**

### 4.2. Cấu hình RTMP Service

**Basic:**
- **Name**: `livestream-rtmp`
- **Region**: Singapore
- **Branch**: `main`
- **Root Directory**: `rtmp-server`
- **Runtime**: Node
- **Build Command**: 
  ```
  npm install
  ```
- **Start Command**: 
  ```
  node server.js
  ```

**Instance Type:**
- Chọn **Free**

**Environment Variables:**
```
NODE_ENV=production
PORT=8000
```

Click **Create Web Service** → Chờ ~3 phút

### 4.3. Lấy RTMP URL

Copy URL:
```
https://livestream-rtmp.onrender.com
```

---

## 🎨 Bước 5: Deploy Frontend (Render.com - FREE)

### 5.1. Tạo Static Site

1. Click **New** → **Static Site**
2. Chọn repository `livestream-app`
3. Click **Connect**

### 5.2. Cấu hình Frontend

**Basic:**
- **Name**: `livestream-frontend`
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Build Command**: 
  ```
  npm install && npm run build
  ```
- **Publish Directory**: 
  ```
  build
  ```

**Environment Variables:**
```
REACT_APP_API_URL=https://livestream-backend.onrender.com
REACT_APP_SOCKET_URL=https://livestream-backend.onrender.com
REACT_APP_RTMP_URL=https://livestream-rtmp.onrender.com
```

Click **Create Static Site** → Chờ ~5 phút

### 5.3. Lấy Frontend URL

Copy URL:
```
https://livestream-frontend.onrender.com
```

---

## 🔄 Bước 6: Cập nhật Backend Environment

Quay lại Backend service và update `CLIENT_URL`:

1. Vào **livestream-backend** service
2. Click **Environment**
3. Sửa `CLIENT_URL`:
   ```
   CLIENT_URL=https://livestream-frontend.onrender.com
   ```
4. Click **Save Changes**
5. Service sẽ tự động redeploy

---

## ✅ Bước 7: Test App

### 7.1. Truy cập Frontend

Mở: `https://livestream-frontend.onrender.com`

### 7.2. Đăng ký tài khoản

1. Click **Đăng ký**
2. Điền thông tin
3. Đăng ký thành công!

### 7.3. Test Stream

1. Vào **Bảng điều khiển Streamer**
2. Copy **RTMP URL** và **Stream Key**
3. Mở OBS:
   - Settings → Stream
   - Service: Custom
   - Server: `rtmp://localhost:1935/live` (nếu test local)
   - Stream Key: [paste key]
4. Start Streaming!

**Lưu ý:** RTMP server trên Render có thể không hoạt động tốt do giới hạn. Xem phần Alternative bên dưới.

---

## 🎯 Alternative: Deploy RTMP riêng (Nếu cần)

### Option 1: Chạy RTMP Local

Nếu chỉ test hoặc stream từ máy cá nhân:

```bash
cd rtmp-server
npm install
node server.js
```

Sau đó stream tới: `rtmp://localhost:1935/live/your_key`

### Option 2: Sử dụng Ngrok (Free)

Expose RTMP server local ra internet:

```bash
# Cài ngrok
npm install -g ngrok

# Chạy RTMP server
cd rtmp-server
node server.js

# Ở terminal khác, expose port 8000
ngrok http 8000
```

Copy URL ngrok và update `REACT_APP_RTMP_URL`.

### Option 3: Railway.app (Free 500 giờ/tháng)

Railway hỗ trợ TCP tốt hơn cho RTMP:

1. Truy cập: https://railway.app
2. Đăng nhập GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Chọn repo, chọn `rtmp-server` folder
5. Add environment variables
6. Deploy!

---

## 🔧 Troubleshooting

### Backend sleep sau 15 phút

**Giải pháp:** Dùng cron job để ping backend mỗi 10 phút

Tạo tài khoản miễn phí tại: https://cron-job.org

- URL: `https://livestream-backend.onrender.com/api/health`
- Interval: Every 10 minutes

### Database connection error

Kiểm tra:
1. Connection string đúng format
2. Password không có ký tự đặc biệt (hoặc encode)
3. Supabase project đang active

### Frontend không load

1. Check build logs trên Render
2. Đảm bảo environment variables đúng
3. Clear cache và rebuild

### RTMP không stream được

**Giải pháp tốt nhất:** Chạy RTMP server local và dùng ngrok.

Render free tier không tốt cho RTMP vì:
- Sleep sau 15 phút
- Không hỗ trợ TCP port 1935
- Bandwidth giới hạn

---

## 📊 So sánh các Platform Free

| Platform | Database | Backend | Frontend | RTMP | Tổng điểm |
|----------|----------|---------|----------|------|-----------|
| **Render + Supabase** | ✅ 500MB | ✅ Free | ✅ Free | ⚠️ Limited | ⭐⭐⭐⭐ |
| **Vercel + Supabase** | ✅ 500MB | ❌ Serverless only | ✅ Free | ❌ No | ⭐⭐⭐ |
| **Railway** | ✅ 1GB | ✅ 500h/month | ✅ Free | ✅ Good | ⭐⭐⭐⭐⭐ |
| **Fly.io** | ✅ 3GB | ✅ 3 VMs | ✅ Free | ✅ Good | ⭐⭐⭐⭐⭐ |

**Khuyến nghị:**
- **Bắt đầu:** Render + Supabase (dễ nhất)
- **Tốt hơn:** Railway (tốt cho RTMP)
- **Tốt nhất:** Fly.io (nhiều resource nhất)

---

## 🚀 Deploy lên Railway (Alternative - Khuyến nghị cho RTMP)

### Tại sao Railway?
- ✅ Free 500 giờ/tháng ($5 credit)
- ✅ Hỗ trợ TCP tốt (cho RTMP)
- ✅ Không sleep
- ✅ Deploy nhanh hơn

### Setup Railway

1. **Tạo tài khoản:** https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. **Connect repo** và chọn `livestream-app`

### Deploy từng service:

**Backend:**
```bash
# Trong Railway dashboard
- Root Directory: backend
- Build Command: npm install && npm run migrate
- Start Command: npm start
- Add Variables:
  NODE_ENV=production
  DATABASE_URL=${{Postgres.DATABASE_URL}}
  JWT_SECRET=[random string]
  JWT_EXPIRE=7d
```

**RTMP Server:**
```bash
- Root Directory: rtmp-server
- Build Command: npm install
- Start Command: node server.js
- Add Variables:
  NODE_ENV=production
  PORT=8000
```

**Frontend:**
```bash
- Root Directory: frontend
- Build Command: npm install && npm run build
- Start Command: npx serve -s build -l $PORT
- Add Variables:
  REACT_APP_API_URL=${{backend.url}}
  REACT_APP_SOCKET_URL=${{backend.url}}
  REACT_APP_RTMP_URL=${{rtmp.url}}
```

**Add PostgreSQL:**
- Click **New** → **Database** → **Add PostgreSQL**
- Tự động connect với backend

---

## 💡 Tips để tối ưu Free Tier

### 1. Giảm sleep time (Render)

Tạo health check endpoint và ping định kỳ:

```javascript
// backend/server.js
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});
```

Dùng UptimeRobot (free) để ping mỗi 5 phút.

### 2. Optimize Database

```sql
-- Xóa data cũ định kỳ
DELETE FROM messages WHERE created_at < NOW() - INTERVAL '7 days';
DELETE FROM rooms WHERE is_live = false AND created_at < NOW() - INTERVAL '1 day';
```

### 3. Compress Assets

```bash
# Frontend build với compression
npm run build

# Kết quả: bundle size giảm ~60%
```

### 4. Use CDN cho static files

Upload images/videos lên:
- Cloudinary (free 25GB)
- ImgBB (free unlimited)
- Imgur (free)

---

## 📈 Khi nào cần upgrade?

**Dấu hiệu cần upgrade:**
- ❌ >50 users đồng thời
- ❌ Backend sleep quá nhiều
- ❌ Database đầy (>500MB)
- ❌ Bandwidth vượt 100GB/tháng

**Upgrade options:**
- Render: $7/tháng (no sleep)
- Railway: $5/tháng (500h → unlimited)
- VPS: $6/tháng (full control)

---

## ✅ Checklist Deploy

- [ ] Code đã push lên GitHub
- [ ] Supabase database đã tạo
- [ ] Backend deployed trên Render
- [ ] RTMP server deployed
- [ ] Frontend deployed
- [ ] Environment variables đã set đúng
- [ ] Test đăng ký/đăng nhập
- [ ] Test tạo room
- [ ] Test stream (nếu có OBS)
- [ ] Test chat realtime

---

## 🎉 Kết luận

Bạn đã deploy thành công app **HOÀN TOÀN MIỄN PHÍ**!

**URL của bạn:**
- Frontend: `https://livestream-frontend.onrender.com`
- Backend: `https://livestream-backend.onrender.com`
- RTMP: `https://livestream-rtmp.onrender.com`

**Chia sẻ với bạn bè:**
```
🎥 Check out my livestream app!
👉 https://livestream-frontend.onrender.com
```

**Next steps:**
- Thêm custom domain (free với Cloudflare)
- Tối ưu performance
- Thêm features mới
- Scale khi có nhiều users

Chúc bạn thành công! 🚀

---

## 📞 Support

Nếu gặp vấn đề:
1. Check logs trên Render dashboard
2. Xem phần Troubleshooting
3. Google error message
4. Hỏi trên Discord/Reddit

**Render logs:**
- Dashboard → Service → Logs
- Xem realtime logs để debug

**Supabase logs:**
- Dashboard → Logs
- Xem database queries

Good luck! 🍀
