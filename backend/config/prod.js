// Helper to trim env variables (fix Vercel \r\n issue)
// This removes CRLF characters that may be added by Vercel CLI
const trimEnv = (val) => val ? val.trim() : val;

// Production environment configuration
// Vercel injects environment variables directly into process.env
module.exports = {
    MONGO_URI: trimEnv(process.env.MONGO_URI),
    GOOGLE_CLIENT_ID: trimEnv(process.env.GOOGLE_CLIENT),
    GOOGLE_CLIENT_SECRET: trimEnv(process.env.GOOGLE_SECRET),
    COOKIE_KEY: trimEnv(process.env.COOKIE_KEY),
    TOKEN_SECRET: trimEnv(process.env.TOKEN_SECRET),
    PASS: trimEnv(process.env.PASS),
    EMAIL_ID: trimEnv(process.env.EMAIL_ID),
    NODE_ENV: trimEnv(process.env.NODE_ENV),
    PORT: process.env.PORT || 5002,
    BACKEND_URL: trimEnv(process.env.REACT_APP_BACKEND_URL),
    FRONTEND_URL: trimEnv(process.env.REACT_APP_FRONTEND_URL),
    CLOUDINARY_NAME: trimEnv(process.env.CLOUDINARY_NAME),
    CLOUDINARY_API_KEY: trimEnv(process.env.CLOUDINARY_API_KEY),
    CLOUDINARY_API_SECRET: trimEnv(process.env.CLOUDINARY_API_SECRET),
}
