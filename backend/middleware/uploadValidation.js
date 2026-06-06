const path = require('path');

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

const uploadValidation = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'No file uploaded. Please select a document to upload.'
    });
  }

  const file = req.file;

  // 1. Validate File Size
  if (file.size > MAX_FILE_SIZE) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'File size exceeds the maximum limit of 10MB.'
    });
  }

  // 2. Validate MIME Type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `Invalid file type. Supported types: PDF, DOCX, DOC, TXT. (MIME: ${file.mimetype})`
    });
  }

  // 3. Validate File Extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: `Invalid file extension "${ext}". Supported extensions: .pdf, .docx, .doc, .txt`
    });
  }

  next();
};

module.exports = uploadValidation;
