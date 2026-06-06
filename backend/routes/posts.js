const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  createPost,
  getPosts,
  getPost,
  likePost,
  toggleSavePost,
  investorReact,
  getPostsByHashtag,
  getTrendingHashtags,
  reportPost
} = require('../controllers/postController');

const { protect, optionalProtect } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 }
]);

router.get('/trending', getTrendingHashtags);
router.get('/hashtag/:tag', optionalProtect, getPostsByHashtag);

router
  .route('/')
  .get(optionalProtect, getPosts)
  .post(protect, uploadFields, createPost);

router
  .route('/:id')
  .get(optionalProtect, getPost);

router
  .route('/:id/like')
  .put(protect, likePost);

router
  .route('/:id/save')
  .put(protect, toggleSavePost);

router
  .route('/:id/react')
  .post(protect, investorReact);

router
  .route('/:id/report')
  .post(protect, reportPost);

module.exports = router;
