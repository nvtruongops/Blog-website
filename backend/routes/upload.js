const express = require("express");
const { uploadImages } = require("../controllers/upload");
const { authUser } = require('../middleware/auth');
const { validateUpload } = require('../middleware/uploadSecurity');
const { uploadLimiter } = require('../middleware/security');

const router = express.Router();

// Apply rate limiting, authentication, and file validation middleware
router.post("/uploadImages", uploadLimiter, authUser, validateUpload, uploadImages);

module.exports = router;
