const dotenv = require("dotenv").config();
const keys = require("../config/keys");
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const userRoutes = require("../routes/user.js");
const uploadRoutes = require("../routes/upload.js");
const postRoutes = require("../routes/post.js");
var cookieParser = require('cookie-parser');

// Security middleware imports
const { 
  configureHelmet, 
  apiLimiter, 
  authLimiter, 
  uploadLimiter, 
  mongoSanitize, 
  xss, 
  hpp 
} = require('../middleware/security');
const { configureSession } = require('../config/session');
const { requestLogger } = require('../helper/securityLogger');

// CORS configuration - cho phép cả với và không có trailing slash
const allowedOrigins = [
  keys.FRONTEND_URL, 
  keys.BACKEND_URL,
  'https://client-eight-cyan-44.vercel.app',
  'https://backend-indol-two-98.vercel.app'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép requests không có origin (health checks, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    // Normalize origin (remove trailing slash)
    const normalizedOrigin = origin.replace(/\/$/, '');
    const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));
    
    if (normalizedAllowed.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-CSRF-Token', 'Retry-After'],
  credentials: true,
  maxAge: 86400,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS' || err.message === 'Origin header required') {
    return res.status(403).json({ message: 'CORS policy: Origin not allowed' });
  }
  next(err);
});

app.use(configureHelmet());
app.use(requestLogger);
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// MongoDB connection with caching for serverless
let cachedDb = null;
async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  mongoose.set("strictQuery", false);
  await mongoose.connect(keys.MONGO_URI);
  cachedDb = mongoose.connection;
  return cachedDb;
}
connectToDatabase();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true, parameterLimit: 1000 }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large. Maximum size is 100KB.' });
  }
  next(err);
});

app.set("trust proxy", 1);
app.use(cookieParser());
app.use(configureSession());
app.use(passport.initialize());
app.use(passport.session());

app.use(fileUpload({ useTempFiles: true }));

app.use('/api', apiLimiter);
app.use("/", userRoutes);
require("../servises/passport");
app.use("/upload", uploadLimiter);
app.use("/", uploadRoutes);
app.use("/", postRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
