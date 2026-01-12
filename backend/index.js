const dotenv = require("dotenv").config();
const keys = require("./config/keys");
const Port = keys.PORT || 5002;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const path = require("path");
const userRoutes = require("./routes/user.js");
const uploadRoutes = require("./routes/upload.js");
const postRoutes = require("./routes/post.js");
var cookieParser = require('cookie-parser');
require('dotenv').config();

// Security middleware imports
const { 
  configureHelmet, 
  apiLimiter, 
  authLimiter, 
  uploadLimiter, 
  mongoSanitize, 
  xss, 
  hpp 
} = require('./middleware/security');
const { configureSession } = require('./config/session');
const { requestLogger } = require('./helper/securityLogger');
// CORS configuration - Requirement 12.4
// Define allowed origins explicitly for security
const allowedOrigins = [keys.FRONTEND_URL, keys.BACKEND_URL].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman) in development
    // In production, you may want to restrict this
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('Origin header required'), false);
      }
      return callback(null, true);
    }
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-CSRF-Token', 'Retry-After'],
  credentials: true,
  maxAge: 86400, // 24 hours - cache preflight requests
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Handle CORS errors
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS' || err.message === 'Origin header required') {
    return res.status(403).json({ message: 'CORS policy: Origin not allowed' });
  }
  next(err);
});

// Apply Helmet security headers - Requirements 4.1-4.6
app.use(configureHelmet());

// Apply request logger for security events - Requirements 8.2, 8.3, 8.5
app.use(requestLogger);

// Apply MongoDB sanitization to prevent NoSQL injection - Requirement 1.3
app.use(mongoSanitize());

// Apply XSS protection - Requirement 1.2
app.use(xss());

// Apply HTTP Parameter Pollution protection
app.use(hpp());

mongoose.set("strictQuery", false);
mongoose.connect(keys.MONGO_URI);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});

// Request body size limits - Requirement 12.2
// Set conservative limits to prevent large payload attacks
// JSON body limit: 100kb for most API requests (sufficient for typical JSON payloads)
// URL-encoded limit: 100kb for form submissions
// Note: File uploads are handled separately by express-fileupload with its own limits
app.use(express.json({ 
  limit: '100kb',
  // Custom error handler for payload too large
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  limit: '100kb', 
  extended: true,
  parameterLimit: 1000 // Limit number of parameters to prevent parameter pollution
}));

// Custom error handler for body parser errors (payload too large)
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ 
      message: 'Request body too large. Maximum size is 100KB.' 
    });
  }
  next(err);
});

app.set("trust proxy", 1);
app.use(cookieParser());

// Apply secure session configuration - Requirements 7.1-7.5
app.use(configureSession());

// Passport v0.6+ requires session.regenerate and session.save to be functions
// This middleware ensures compatibility with express-session
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

app.use(passport.initialize());
app.use(passport.session());

app.use(
  fileUpload({
    useTempFiles: true,
  })
);

// Ảnh đã migrate lên Cloudinary - không cần serve static uploads nữa

// Apply general API rate limiter - Requirement 5.2
app.use('/api', apiLimiter);

// Apply routes with specific rate limiters
app.use("/", userRoutes);
require("./servises/passport");

// Apply upload rate limiter for upload routes - Requirement 5.3
app.use("/upload", uploadLimiter);
app.use("/", uploadRoutes);
app.use("/", postRoutes);

app.listen(Port, () => {
  console.log(`server running ${Port}`);
});
