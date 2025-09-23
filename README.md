# 🌟 IT Dream API – Backend (Express + Sequelize + MySQL)

Hệ thống **backend** quản lý tài khoản, phân quyền, chuyên ngành, *simulation* và *task*, được xây dựng với **Node.js/Express**, **Sequelize (MySQL)**, xác thực **JWT**, tài liệu **Swagger** và hỗ trợ **Elasticsearch** cho tính năng tìm kiếm.

---

## 📋 Mục lục
- [🚀 Yêu cầu môi trường](#-yêu-cầu-môi-trường)
- [📂 Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [⚙️ Thiết lập biến môi trường](#️-thiết-lập-biến-môi-trường)
- [▶️ Cài đặt & Chạy](#️-cài-đặt--chạy)
- [📑 Tài liệu API (Swagger)](#-tài-liệu-api-swagger)
- [🔐 Xác thực & Phân quyền](#-xác-thực--phân-quyền)
- [🌐 Danh sách Endpoint](#-danh-sách-endpoint)
- [🔎 Elasticsearch](#-elasticsearch)
- [💡 Ghi chú triển khai](#-ghi-chú-triển-khai)
- [📜 Script npm](#-script-npm)

---

## 🚀 Yêu cầu môi trường
- **Node.js**: 18+
- **MySQL**: 8+ (hoặc tương thích)
- **Elasticsearch**: 8+ *(tùy chọn nếu dùng tính năng search)*

---

## 📂 Cấu trúc thư mục
```
src/
├─ server.js              # Khởi động app, CORS, Swagger, auto router, sync DB
├─ config/                # Cấu hình DB, Swagger, Elasticsearch
├─ middleware/            # JWT sign/verify & middleware xác thực
├─ route/                 # Khai báo endpoint (Account, Student, Educator, ...)
├─ controller/            # Xử lý nghiệp vụ từng module
├─ model/                 # Sequelize models & quan hệ
├─ constants/constant.js  # Hằng số domain (status, kind, level, ...)
├─ service/               # Dịch vụ (email, search,...)
├─ utils/                 # Hàm tiện ích
└─ validation/            # Validate dữ liệu
```

---

## ⚙️ Thiết lập biến môi trường
Tạo file **.env** ở thư mục gốc:

```env
# Server
PORT=8181
HOST_NAME=localhost
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=it_dream
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Elasticsearch (optional)
ES_URL=http://localhost:9200
```

💡 **Lưu ý**  
- `NODE_ENV=production`: chỉ cho phép origin trong danh sách `allowedOrigins` (cấu hình trong `src/server.js`).  
- Mặc định **sequelize.sync({ alter: true })** đang bật → Không khuyến nghị trên môi trường **production**. Hãy dùng **migration**.

---

## ▶️ Cài đặt & Chạy
```bash
# Cài dependencies
npm install

# Chạy chế độ dev với nodemon
npm run dev
```
🌐 Server mặc định: [http://localhost:8181](http://localhost:8181)

---

## 📑 Tài liệu API (Swagger)
- **Swagger UI**: [http://localhost:8181/api-docs](http://localhost:8181/api-docs)
- Bảo mật: **Bearer JWT** (`bearerAuth`) đã được cấu hình sẵn.

---

## 🔐 Xác thực & Phân quyền
- **Đăng nhập**: `POST /api/token` → trả về `accessToken` và `refreshToken`.
- **Middleware** `authenticate`:
  - Đọc `Authorization: Bearer <token>`.
  - Verify bằng `JWT_ACCESS_SECRET`.
  - Gắn thông tin vào `req.user` gồm:  
    ```json
    {
      "id": "...",
      "username": "...",
      "kind": "Admin | Educator | Student",
      "pCodes": ["PERMISSION_CODE"]
    }
    ```
- Kiểm tra quyền trong controller bằng `req.user.kind` hoặc `pCodes`.

---

## 🌐 Danh sách Endpoint
Hầu hết endpoint nằm dưới prefix `/v1`, **ngoại trừ** `POST /api/token`.

### 🔑 Account
| Method | Endpoint | Mô tả |
|-------|----------|------|
| POST  | /api/token | Đăng nhập lấy token |
| POST  | /v1/account/verify-otp | Xác thực OTP |
| POST  | /v1/account/resend-otp | Gửi lại OTP |
| POST  | /v1/account/forgot-password | Quên mật khẩu |
| POST  | /v1/account/reset-password | Đặt lại mật khẩu |
| POST  | /v1/admin/create | (Auth) Tạo admin |
| GET   | /v1/admin/profile | (Auth) Xem profile admin |

### 🎓 Student
| Method | Endpoint | Mô tả |
|-------|----------|------|
| POST  | /v1/student/register | Đăng ký student (gửi OTP) |
| GET   | /v1/student/profile | (Auth) Thông tin student |
| GET   | /v1/student/list | (Admin) Danh sách |
| ...   | ... | Xem chi tiết, update, delete, client-update |

### 👨‍🏫 Educator
Tương tự Student (thêm `approve` cho Admin).

### 🛡️ Group & Permission (Admin)
- `POST /v1/group/create`
- `PUT /v1/group/update`
- `POST /v1/permission/create`
- `GET /v1/permission/list`

### 💡 Specialization (Admin)
CRUD chuyên ngành.

### 🧩 Simulation
- CRUD simulation cho Educator/Admin/Student.
- `GET /v1/simulation/search` → tìm kiếm với **Elasticsearch**.

### ✅ Task
- Tạo task & subtask (Educator).
- Liệt kê cho Admin/Educator/Student.

*(Xem chi tiết trong Swagger UI)*

---

## 🔎 Elasticsearch
- Client: `src/config/elasticSeachConfig.js`
- Endpoint sử dụng: `GET /v1/simulation/search`

---

## 💡 Ghi chú triển khai
- **Production**:
  - Cấu hình CORS phù hợp.
  - Bảo mật JWT secret (sử dụng Secret Manager hoặc biến môi trường).
  - Thay `sequelize.sync` bằng **migration**.
- **Database**:
  - Tối ưu index khi dữ liệu lớn.

---

## 📜 Script npm
| Script | Mô tả |
|-------|------|
| `npm run dev` | Chạy server với **nodemon** |
| `npm start`   | Chạy server thường (production) |

---

✨ **IT Dream API** – Sẵn sàng cho môi trường phát triển và mở rộng tính năng tìm kiếm với Elasticsearch.  
📚 Tham khảo thêm chi tiết trong **Swagger UI** để khám phá toàn bộ API.
