const express = require('express');
const router = express.Router();
const multer = require('multer');
const ragController = require('../controllers/ragController');
const { protect, optionalProtect } = require('../middleware/auth');
const uploadValidation = require('../middleware/uploadValidation');
const ragSecurity = require('../middleware/ragSecurity');

// Initialize multer memory storage for documents
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// POST /api/rag/upload
router.post(
  '/upload',
  optionalProtect,
  upload.single('file'),
  uploadValidation,
  ragController.uploadDocument
);

// POST /api/rag/chat
router.post(
  '/chat',
  optionalProtect,
  ragSecurity.validateRAGRequest,
  ragController.chat
);

// POST /api/rag/search
router.post(
  '/search',
  optionalProtect,
  ragSecurity.validateRAGRequest,
  ragController.semanticSearch
);

// GET /api/rag/document/:id
router.get(
  '/document/:id',
  protect,
  ragController.getDocument
);

// GET /api/rag/documents
router.get(
  '/documents',
  protect,
  ragController.getDocuments
);

// POST /api/rag/investor-match
router.post(
  '/investor-match',
  protect,
  ragController.investorMatch
);

module.exports = router;
