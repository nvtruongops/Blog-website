require('dotenv').config();

// Sử dụng cùng tên biến cho cả dev và production
// Vercel sẽ inject các biến môi trường tương ứng
module.exports = {
    MONGO_URI: process.env.MONGO_URI,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_SECRET,
    COOKIE_KEY: process.env.COOKIE_KEY,
    TOKEN_SECRET: process.env.TOKEN_SECRET,
    PASS: process.env.PASS,
    EMAIL_ID: process.env.EMAIL_ID,
    PORT: process.env.PORT || 5002,
    BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL,
    CLOUDINARY_NAME: process.env.CLOUDINARY_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
}
