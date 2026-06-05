const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');
const { uploadFromBuffer } = require('../utils/socialHelpers'); // We'll double-check this, or we can require ../utils/cloudinary

let uploadFromBufferHelper;
try {
  const { uploadFromBuffer } = require('../utils/cloudinary');
  uploadFromBufferHelper = uploadFromBuffer;
} catch (e) {
  console.error('Could not import from cloudinary utility:', e);
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit for general uploads
  }
});

const saveFileLocally = async (req, file) => {
  const publicDir = path.join(__dirname, '../public');
  const uploadDir = path.join(publicDir, 'uploads');
  const fileTypeDir = path.join(uploadDir, file.mimetype.startsWith('video/') ? 'videos' : 'images');

  // Create directories if they do not exist
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  if (!fs.existsSync(fileTypeDir)) fs.mkdirSync(fileTypeDir, { recursive: true });

  const timestamp = Date.now();
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';

  const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
  const filename = `file_${timestamp}_${cleanName}`;
  const filePath = path.join(fileTypeDir, filename);
  
  fs.writeFileSync(filePath, file.buffer);
  
  const subFolder = file.mimetype.startsWith('video/') ? 'videos' : 'images';
  const url = `${protocol}://${host}/public/uploads/${subFolder}/${filename}`;

  return url;
};

router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const file = req.file;
    let url = '';
    let cloudinaryId = '';

    const isCloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (isCloudinaryConfigured && uploadFromBufferHelper) {
      try {
        console.log('Attempting Cloudinary upload from generic upload route...');
        const folder = file.mimetype.startsWith('video/') ? 'videos' : 'images';
        const result = await uploadFromBufferHelper(file.buffer, `founderx/${folder}`);
        url = result.secure_url;
        cloudinaryId = result.public_id;
      } catch (err) {
        console.error('Cloudinary generic upload failed, falling back to local:', err);
        url = await saveFileLocally(req, file);
      }
    } else {
      console.log('Cloudinary not configured on backend, saving generic upload locally...');
      url = await saveFileLocally(req, file);
    }

    res.status(200).json({
      success: true,
      url,
      type: file.mimetype.startsWith('video/') ? 'video' : 'image',
      cloudinaryId
    });
  } catch (error) {
    console.error('Generic upload error:', error);
    res.status(500).json({ success: false, error: error.message || 'Upload failed' });
  }
});

module.exports = router;
