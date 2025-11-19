# 🎥 Streemly - Nền tảng Livestream

> Nền tảng livestream với độ trễ thấp, chat realtime và giao diện đẹp mắt theo phong cách YouTube.

## Tính năng nổi bật

- **Authentication** - Đăng ký/Đăng nhập với JWT, email-based
- **Live Streaming** - Stream video với FLV (độ trễ 2-3 giây)
- **Real-time Chat** - Chat trực tiếp với Socket.io
- **Viewer Count** - Đếm số người xem real-time
- **Search & Discovery** - Tìm kiếm và khám phá streams
- **Room Management** - Tạo và quản lý phòng stream
- **Modern UI** - Giao diện YouTube-inspired với dark/light theme
- **Low Latency** - Độ trễ cực thấp với HTTP-FLV
- **Responsive** - Hoạt động mượt mà trên mọi thiết bị

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](ARCHITECTURE.md)   | Kiến trúc hệ thống |
| [FAQ.md](FAQ.md)                     | Câu hỏi thường gặp |

## Hướng dẫn sử dụng

### Cho Streamer

1. **Đăng ký tài khoản**
   - Vào trang chủ → Click "Đăng ký"
   - Điền username, email, password
   
2. **Tạo phòng stream**
   - Vào "Bảng điều khiển Streamer"
   - Điền tiêu đề, mô tả, chọn danh mục
   - Click "Tạo phòng stream"
   
3. **Cấu hình OBS Studio**
   - Settings → Stream
   - Service: Custom
   - Server: `rtmp://localhost:1935/live`
   - Stream Key: Copy từ dashboard
   
4. **Bắt đầu stream**
   - Click "Start Streaming" trong OBS
   - Đợi 5-10 giây để stream khởi động
   - Chat với viewers trong dashboard

### Cho Viewer

1. **Khám phá streams**
   - Vào trang "Khám phá"
   - Xem danh sách streams đang live
   
2. **Xem stream**
   - Click vào stream muốn xem
   - Video tự động phát
   
3. **Chat**
   - Đăng nhập để chat
   - Gửi tin nhắn trong chat box
   - Tương tác với streamer và viewers khác

## License

This project is licensed under the MIT License.

## Show your support

Nếu project này hữu ích, hãy cho một ⭐ trên GitHub!

---

<div align="center">

**1usuzu**

**Version:** 1.0.0 | **Status:** ✅ Production Ready

[⬆ Back to top](#-streemly---nền-tảng-livestream-hiện-đại)

</div>
