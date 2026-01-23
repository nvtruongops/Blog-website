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
  'http://localhost:3000', // Local development
  'http://localhost:5002'  // Local development
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
// Note: xss() disabled for file uploads - it can corrupt binary data
// app.use(xss());
app.use(hpp());

// MongoDB connection with caching for serverless
let cachedDb = null;
let isConnected = false;
async function connectToDatabase() {
  if (cachedDb && isConnected) {
    return cachedDb;
  }
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(keys.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    cachedDb = mongoose.connection;
    isConnected = true;
    console.log('MongoDB connected successfully');
    return cachedDb;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    isConnected = false;
    throw error;
  }
}

// Handle connection events
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
  isConnected = false;
});

connectToDatabase();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 1000 }));

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large. Maximum size is 10MB.' });
  }
  next(err);
});

app.set("trust proxy", 1);
app.use(cookieParser());
app.use(configureSession());

// Passport compatibility and session validation
app.use((req, res, next) => {
  if (req.session && !req.session.regenerate) {
    req.session.regenerate = (cb) => {
      cb();
    };
  }
  if (req.session && !req.session.save) {
    req.session.save = (cb) => {
      cb();
    };
  }
  next();
});

// Ensure database connection before processing requests
app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectToDatabase();
    } catch (error) {
      console.error('Failed to connect to database:', error);
      return res.status(500).json({ 
        message: 'Database connection failed',
        error: error.message 
      });
    }
  }
  
  // Verify session is available for routes that need it
  if (req.path.includes('/csrf-token') && !req.session) {
    console.error('Session not initialized for CSRF endpoint');
    return res.status(500).json({ 
      message: 'Server configuration error',
      error: 'Session initialization failed'
    });
  }
  
  next();
});

app.use(passport.initialize());
app.use(passport.session());

app.use(fileUpload({ 
  useTempFiles: true,
  tempFileDir: '/tmp/',  // Required for Vercel serverless
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  abortOnLimit: true,
  debug: true // Enable debug logging
}));

// Debug middleware for upload route
app.use('/uploadImages', (req, res, next) => {
  console.log('[Upload Debug] Before route:', {
    method: req.method,
    hasFiles: !!req.files,
    hasBody: !!req.body,
    contentLength: req.headers['content-length'],
    contentType: req.headers['content-type']
  });
  next();
});

app.use('/api', apiLimiter);
app.use("/", userRoutes);
require("../servises/passport");
app.use("/upload", uploadLimiter);
app.use("/", uploadRoutes);
app.use("/", postRoutes);

// Admin routes
const adminRoutes = require("../routes/admin.js");
app.use("/admin", adminRoutes);

// Moderator routes
const moderatorRoutes = require("../routes/moderator.js");
app.use("/moderator", moderatorRoutes);

// Report routes (for users to submit reports)
const { createReport } = require("../controllers/moderator.js");
const { authUser } = require("../middleware/auth");
app.post("/reports", authUser, createReport);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Blog API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongoConnected: isConnected,
    sessionConfigured: !!req.session
  });
});

module.exports = app;
