# Blog Website

Ứng dụng blog đa người dùng full-stack với Next.js và Express.js.

## Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- React 18
- Redux Toolkit
- Axios
- Jodit Editor (Rich text)

**Backend:**
- Express.js
- MongoDB + Mongoose
- Passport.js (Google OAuth)
- Cloudinary (Image hosting)
- Nodemailer (Email)
- Axiom (Logging - optional)

## Tính năng

### Authentication
- Đăng ký/Đăng nhập với Email & Password
- Google OAuth 2.0
- Xác thực email
- Đặt lại mật khẩu
- Session management với MongoDB store

### Blog
- Tạo, chỉnh sửa, xóa bài viết
- Rich text editor (Jodit)
- Upload ảnh lên Cloudinary
- Phân loại theo topic
- Infinite scroll
- Export PDF

### User
- Trang profile cá nhân
- Quản lý bài viết

### Bảo mật
- Helmet (Security headers)
- Rate limiting (API, Auth, Upload)
- CORS configuration
- MongoDB sanitization (NoSQL injection)
- XSS protection
- HPP (HTTP Parameter Pollution)
- CSRF protection
- Input validation (express-validator)
- Security logging

## Cấu trúc dự án

```
├── backend/              # Express.js API server
│   ├── config/           # Cấu hình (keys, session, env)
│   ├── controllers/      # Route handlers
│   ├── helper/           # Utilities (mail, token, validation)
│   ├── middleware/       # Auth, security, validation
│   ├── models/           # MongoDB schemas
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Code.js       # Password reset codes
│   │   ├── LoginAttempt.js
│   │   └── SecurityLog.js
│   ├── routes/           # API routes
│   │   ├── user.js       # Auth & user endpoints
│   │   ├── post.js       # Blog post endpoints
│   │   └── upload.js     # File upload endpoints
│   └── servises/         # Passport strategies
│
└── client/               # Next.js frontend
    └── src/
        ├── app/          # Pages (App Router)
        │   ├── auth/     # Login/Register
        │   ├── article/  # View post
        │   ├── write/    # Create post
        │   ├── edit/     # Edit post
        │   ├── profile/  # User profile
        │   ├── topic/    # Posts by topic
        │   └── reset-password/
        ├── components/   # React components
        ├── lib/          # API utilities
        └── store/        # Redux store
```

## Cài đặt

### 1. Clone repository
```bash
git clone <repo-url>
cd blog
```

### 2. Cấu hình Backend

```bash
cd backend
cp .env.example .env
npm install
```

Chỉnh sửa `backend/.env`:
```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/blog

# Google OAuth (https://console.cloud.google.com)
GOOGLE_CLIENT=your_google_client_id
GOOGLE_SECRET=your_google_client_secret

# Session & JWT
COOKIE_KEY=your_cookie_secret_key
TOKEN_SECRET=your_jwt_secret_key

# Email (Gmail App Password)
EMAIL_ID=your_email@gmail.com
PASS=your_email_app_password

# Server
PORT=5002

# URLs
REACT_APP_BACKEND_URL=http://localhost:5002
REACT_APP_FRONTEND_URL=http://localhost:3000

# Cloudinary (https://cloudinary.com)
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Axiom Logging (Optional)
AXIOM_TOKEN=your_axiom_api_token
AXIOM_DATASET=blog-logs
AXIOM_ORG_ID=your_org_id
```

### 3. Cấu hình Frontend

```bash
cd client
cp .env.local.example .env.local
npm install
```

Chỉnh sửa `client/.env.local`:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5002
```

### 4. Chạy ứng dụng

```bash
# Terminal 1 - Backend (port 5002)
cd backend
npm start

# Terminal 2 - Frontend (port 3000)
cd client
npm run dev
```

Truy cập: http://localhost:3000

## API Endpoints

### Authentication
- `POST /register` - Đăng ký
- `POST /login` - Đăng nhập
- `POST /logout` - Đăng xuất
- `GET /auth/google` - Google OAuth
- `POST /sendverification` - Gửi email xác thực
- `POST /verify` - Xác thực email
- `POST /sendresetpassword` - Gửi email reset password
- `POST /resetpassword` - Đặt lại mật khẩu

### Posts
- `GET /getallposts` - Lấy tất cả bài viết
- `GET /getpost/:id` - Lấy bài viết theo ID
- `POST /createpost` - Tạo bài viết (auth required)
- `PUT /updatepost/:id` - Cập nhật bài viết (auth required)
- `DELETE /deletepost/:id` - Xóa bài viết (auth required)

### Upload
- `POST /upload/images` - Upload ảnh lên Cloudinary

### User
- `GET /getuser/:id` - Lấy thông tin user
- `PUT /updateuser` - Cập nhật profile (auth required)

## Testing

```bash
cd backend
npm test
```

## License

MIT
