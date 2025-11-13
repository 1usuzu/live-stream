# 🔧 Quick Fix - Local Development

## Lỗi: Database connection failed (ECONNREFUSED)

### ❌ Nguyên nhân:
PostgreSQL chưa chạy trên máy local.

### ✅ Giải pháp:

#### Cách 1: Dùng script (Dễ nhất)
```bash
# Kiểm tra services
check-services.bat

# Start PostgreSQL
start-postgres.bat
```

#### Cách 2: Manual
1. **Mở Services:**
   - Press `Win + R`
   - Type: `services.msc`
   - Enter

2. **Tìm PostgreSQL:**
   - Tìm service tên "postgresql-x64-14" (hoặc version khác)
   
3. **Start service:**
   - Right-click → Start
   - Hoặc click "Start" button

#### Cách 3: Command line
```bash
# Thử các lệnh này:
net start postgresql-x64-14
# hoặc
net start postgresql-x64-15
# hoặc
net start PostgreSQL
```

---

## Sau khi start PostgreSQL:

### 1. Tạo database (nếu chưa có):
```bash
# Mở Command Prompt
createdb -U postgres livestream_app
```

Nếu lỗi "createdb not found":
```bash
# Tìm psql.exe (thường ở C:\Program Files\PostgreSQL\14\bin)
cd "C:\Program Files\PostgreSQL\14\bin"
createdb -U postgres livestream_app
```

### 2. Chạy migration:
```bash
cd backend
npm run migrate
```

### 3. Start lại backend:
```bash
cd backend
npm run dev
```

---

## Kiểm tra kết nối:

### Test PostgreSQL:
```bash
psql -U postgres -d livestream_app -c "SELECT NOW();"
```

### Test backend:
```bash
curl http://localhost:3000/health
```

---

## Nếu không có PostgreSQL:

### Download & Install:
1. Tải: https://www.postgresql.org/download/windows/
2. Chọn version 14 hoặc mới hơn
3. Install với password: `password123` (hoặc đổi trong .env)
4. Chọn port: `5432`

### Sau khi install:
```bash
# Tạo database
createdb -U postgres livestream_app

# Chạy migration
cd backend
npm run migrate

# Start backend
npm run dev
```

---

## Alternative: Dùng Docker

Nếu không muốn install PostgreSQL:

```bash
# Start PostgreSQL với Docker
docker run -d \
  --name postgres-livestream \
  -e POSTGRES_PASSWORD=password123 \
  -e POSTGRES_DB=livestream_app \
  -p 5432:5432 \
  postgres:14

# Chạy migration
cd backend
npm run migrate

# Start backend
npm run dev
```

---

## Checklist:

- [ ] PostgreSQL service đang chạy
- [ ] Database `livestream_app` đã tạo
- [ ] Migration đã chạy
- [ ] Backend start thành công
- [ ] Frontend kết nối được backend

---

**Sau khi fix xong, chạy:**
```bash
start-dev.bat
```

Mọi thứ sẽ hoạt động! 🚀
