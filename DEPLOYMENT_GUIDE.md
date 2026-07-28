# 🚀 HƯỚNG DẪN DEPLOY ỨNG DỤNG LÊN VERCEL & CÁC NỀN TẢNG CLOUD

Tài liệu hướng dẫn chi tiết cách đưa ứng dụng **Quản Lý Lớp Học Số** lên **Vercel** (và Netlify / Cloudflare Pages) thành công 100%, không bị lỗi đường dẫn 404 khi tải lại trang, đồng bộ Firebase và Gemini AI mượt mà.

---

## 📦 Các Tệp Cấu Hình Đã Được Tạo Tự Động Trong Dự Án

| Tệp Cấu Hình | Vai Trò |
|---|---|
| `vercel.json` | Cấu hình Rewrites chuyển hướng URL SPA cho Vercel (sửa lỗi 404 trang khi F5) và Caching assets |
| `netlify.toml` | Cấu hình cho nền tảng Netlify |
| `vite.config.ts` | Phân tách gói vendor (Chunk Splitting: React, Firebase, Export, Icons) giúp Vercel build siêu nhanh |
| `.env.example` | Mẫu danh sách biến môi trường Firebase & Gemini AI |

---

## 🛠️ CÁCH 1: DEPLOY LÊN VERCEL (KHUYÊN DÙNG - NHANH NHẤT)

### Bước 1: Đẩy code dự án lên GitHub / GitLab / Bitbucket
1. Tạo một repository mới trên GitHub (ví dụ: `quan-ly-lop-hoc-so`).
2. Tiến hành push mã nguồn dự án lên GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Vercel deploy"
   git branch -M main
   git remote add origin https://github.com/your-username/quan-ly-lop-hoc-so.git
   git push -u origin main
   ```

### Bước 2: Kết nối Vercel với GitHub
1. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập (bằng tài khoản GitHub).
2. Tại Vercel Dashboard, nhấn **"Add New..."** ➔ chọn **"Project"**.
3. Tìm và chọn repository `quan-ly-lop-hoc-so` ➔ bấm **"Import"**.

### Bước 3: Cấu hình Build & Biến Môi Trường (Environment Variables) trên Vercel
1. **Framework Preset**: Chọn **Vite**.
2. **Root Directory**: Để mặc định `./`.
3. **Build Command**: `npm run build` (hoặc `vite build`).
4. **Output Directory**: `dist`.
5. **Environment Variables**: Thêm các biến môi trường từ Firebase và Gemini AI:
   - `VITE_FIREBASE_API_KEY`: *(Key Firebase của bạn)*
   - `VITE_FIREBASE_AUTH_DOMAIN`: *(Domain Firebase Auth)*
   - `VITE_FIREBASE_PROJECT_ID`: *(Project ID Firebase)*
   - `VITE_FIREBASE_STORAGE_BUCKET`: *(Storage Bucket)*
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`: *(Messaging Sender ID)*
   - `VITE_FIREBASE_APP_ID`: *(App ID)*
   - `VITE_GEMINI_API_KEY`: *(Key Google AI Studio)*
   - `GEMINI_API_KEY`: *(Key Google AI Studio)*

6. Nhấn nút **"Deploy"**. Vercel sẽ tự động build ứng dụng trong khoảng **30 - 45 giây**.

---

## ⚡ CÁCH 2: DEPLOY TRỰC TIẾP BẰNG VERCEL CLI (KHÔNG CẦN GITHUB)

Nếu bạn muốn deploy trực tiếp từ dòng lệnh máy tính:

1. Cài đặt Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Đăng nhập Vercel từ terminal:
   ```bash
   vercel login
   ```
3. Đứng tại thư mục dự án và chạy lệnh deploy:
   ```bash
   vercel --prod
   ```
4. Làm theo hướng dẫn trên màn hình CLI, chọn thiết lập mặc định. Dự án sẽ được đưa lên trang web chính thức ngay lập tức!

---

## 🔑 ĐÒNG BỘ FIREBASE AUTHENTICATION DOMAIN (RẤT QUAN TRỌNG)

Để tính năng **Đăng nhập Google** hoạt động chuẩn xác trên trang web Vercel mới deploy:

1. Mở trang Vercel, copy tên miền website vừa tạo (ví dụ: `https://quan-ly-lop-hoc-so.vercel.app`).
2. Truy cập [Firebase Console](https://console.firebase.google.com).
3. Chọn project của bạn ➔ chọn **Authentication** ➔ thẻ **Settings** ➔ mục **Authorized domains**.
4. Bấm **"Add domain"** ➔ Dán tên miền Vercel của bạn vào (ví dụ: `quan-ly-lop-hoc-so.vercel.app`).
5. Bấm **Save**. Giờ đây tính năng Đăng nhập bằng Google trên trang Vercel sẽ hoạt động mượt mà 100%!

---

## 🎉 CHÚC MỪNG BẠN ĐÃ XUẤT BẢN THÀNH CÔNG!
Nếu cần nâng cấp tên miền riêng (Domain), bạn chỉ cần vào Vercel Project Settings > **Domains** và thêm tên miền tùy chỉnh của mình.
