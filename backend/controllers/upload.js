const fs = require("fs");
const path = require("path");
const keys = require("../config/keys");

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

exports.uploadImages = async (req, res) => {
  try {
    const { path: uploadPath } = req.body;
    let images = [];

    const url = await uploadToLocal(req.files.file, uploadPath);
    images.push(url);

    removeTmp(req.files.file);
    res.json(images);
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Upload local - lưu trên server
const uploadToLocal = async (file, uploadPath) => {
  return new Promise((resolve, reject) => {
    try {
      const ext = path.extname(file.name);
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${ext}`;
      
      const subDir = path.join(uploadsDir, uploadPath || "");
      if (!fs.existsSync(subDir)) {
        fs.mkdirSync(subDir, { recursive: true });
      }

      const filePath = path.join(subDir, filename);
      fs.copyFileSync(file.tempFilePath, filePath);

      const relativePath = `/uploads/${uploadPath ? uploadPath + "/" : ""}${filename}`;
      const fullUrl = `${keys.BACKEND_URL}${relativePath}`;
      
      resolve({ url: fullUrl });
    } catch (error) {
      reject(error);
    }
  });
};

const removeTmp = (file) => {
  fs.unlink(file.tempFilePath, (err) => {
    if (err) console.error("Remove temp file error:", err);
  });
};
