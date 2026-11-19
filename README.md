# 🎁 SangDev 3D Gift Studio

> Hệ thống tạo & tùy chỉnh quà tặng 3D đa cảnh (Bó hoa, Thẻ cào bí mật, Lịch xé 3D, Hạt ánh sáng tình yêu & Pháo hoa 3D) cá nhân hóa cho từng người qua API & mã code riêng biệt.

---

## 🚀 Tính năng nổi bật

- **3D Interactive Experience:** Dựng trên nền Three.js với hiệu ứng xé lịch, bướm bay, bó hoa vĩnh cửu, cào thẻ quà tặng bí mật và pháo hoa 3D.
- **Cá nhân hóa 100%:** Mỗi người tạo 1 mã code riêng (`/g/{CODE}`), ảnh riêng, thư riêng và nhạc riêng.
- **Trình tạo SangDev Studio (`create.html`):**
  - Giao diện Dark Mode Studio cao cấp (Linear / Vercel style).
  - Tích hợp khung xem thử (Live Device Mockup) thời gian thực.
  - Hỗ trợ tải ảnh từ máy tính hoặc dán link online (Imgur, Catbox, Cloudinary...).
  - **Trích xuất nhạc tự động từ YouTube & TikTok** sang MP3 chỉ trong vài giây.
  - Phím tắt `Ctrl + S` để Deploy ngay tức thì.

---

## 🛠️ Triển khai lên Render.com (1-Click Deploy)

Dự án đã có sẵn file cấu hình `render.yaml` chuẩn cho Render Web Service:

1. **Đẩy mã nguồn lên GitHub của bạn:**
   ```bash
   git add .
   git commit -m "feat: complete sangdev 3d gift studio"
   git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/TÊN_REPO.git
   git branch -M main
   git push -u origin main
   ```

2. **Triển khai trên Render:**
   - Truy cập [dashboard.render.com](https://dashboard.render.com/).
   - Bấm **New +** $\rightarrow$ chọn **Web Service**.
   - Chọn kho lưu trữ GitHub vừa tạo của bạn.
   - Render sẽ tự nhận diện cấu hình:
     - **Environment:** `Node`
     - **Build Command:** `npm install`
     - **Start Command:** `node server.js`
   - Bấm **Create Web Service** $\rightarrow$ Đợi 1 phút là web sẽ online với domain miễn phí dạng `https://sangdev-3d-gift.onrender.com`!

---

## 💻 Chạy cục bộ (Local Development)

```bash
# Khởi động server
npm start
# Hoặc chế độ dev tự reload khi sửa code
npm run dev
```

* **Trang Studio tạo quà:** [http://localhost:3000/create.html](http://localhost:3000/create.html)
* **Xem quà tặng:** [http://localhost:3000/gift?code=PVB33A62](http://localhost:3000/gift?code=PVB33A62)
* **Link rút gọn:** [http://localhost:3000/g/PVB33A62](http://localhost:3000/g/PVB33A62)

---

## 📜 Giấy phép & Tác giả

Phát triển bởi **sangdev** © 2026.
