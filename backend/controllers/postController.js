const Post = require('../models/Post');
const User = require('../models/User');
const Startup = require('../models/Startup');
const Comment = require('../models/Comment');
const { createNotification, parseMentionsAndHashtags } = require('../utils/socialHelpers');
const fs = require('fs');
const path = require('path');

const savePostFileLocally = async (req, file) => {
  const publicDir = path.join(__dirname, '../public');
  const uploadDir = path.join(publicDir, 'uploads');
  const postDir = path.join(uploadDir, 'posts');

  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });

  const timestamp = Date.now();
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';

  const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
  const filename = `post_${timestamp}_${cleanName}`;
  const filePath = path.join(postDir, filename);

  fs.writeFileSync(filePath, file.buffer);

  return `${protocol}://${host}/public/uploads/posts/${filename}`;
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
exports.createPost = async (req, res) => {
  try {
    console.log('Creating post with body:', req.body);
    
    // Support both 'content' and 'text', and handle body/FormData values
    const content = req.body.content || req.body.text || '';
    const category = req.body.category || 'general';
    const contentTypeVal = req.body.contentType || '';
    const typeVal = req.body.type || '';
    const parentPostId = req.body.parentPostId || null;
    const quoteBody = req.body.quoteBody || '';
    const repostOf = req.body.repostOf || null;
    const videoLength = req.body.videoLength || 0;
    const startupId = req.body.startupId || null;
    
    let mediaUrl = req.body.mediaUrl || req.body.imageUrl || '';

    // Handle Repost (Simple or Quote)
    if (repostOf) {
      const originalPost = await Post.findById(repostOf);
      if (!originalPost) {
        return res.status(404).json({ success: false, error: 'Original post not found' });
      }

      const postData = {
        authorId: req.user.id,
        content: quoteBody || '', // Quote body if quote repost
        contentType: 'tweet', // Reposts are treated as tweets in the feed
        type: 'text',
        isRepost: true,
        repostOf,
        quoteBody
      };

      const post = await Post.create(postData);
      
      // Increment repost count on original
      originalPost.repostCount += 1;
      await originalPost.save();

      // Notify original author
      await createNotification({
        recipient: originalPost.authorId,
        sender: req.user.id,
        type: quoteBody ? 'reply' : 'repost', // 'reply' for quote/comment, 'repost' for simple share
        entityId: post._id,
        entityType: 'Post',
        content: quoteBody || ''
      }, req.app.get('io'));

      return res.status(201).json({ success: true, data: post });
    }

    // Handle standard image/video file upload from FormData if present
    const imageFile = (req.files && req.files.image && req.files.image[0]) || 
                      (req.files && req.files.file && req.files.file[0]) || 
                      req.file;

    if (imageFile) {
      const isCloudinaryConfigured =
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET;

      if (isCloudinaryConfigured) {
        try {
          const { uploadFromBuffer } = require('../utils/cloudinary');
          console.log('Uploading post file to Cloudinary...');
          const result = await uploadFromBuffer(imageFile.buffer, 'founderx/posts');
          mediaUrl = result.secure_url;
        } catch (cloudinaryError) {
          console.error('Cloudinary post upload failed, falling back to local:', cloudinaryError);
          mediaUrl = await savePostFileLocally(req, imageFile);
        }
      } else {
        console.log('Cloudinary not configured on backend, saving post file locally...');
        mediaUrl = await savePostFileLocally(req, imageFile);
      }
    }

    // Handle Standard Post / Reply
    const { mentions, hashtags } = await parseMentionsAndHashtags(content || '');

    // Determine contentType if not provided (fallback/legacy)
    let finalContentType = contentTypeVal;
    if (!finalContentType) {
        if (typeVal === 'video' || (imageFile && imageFile.mimetype.startsWith('video/'))) finalContentType = 'vtweet';
        else if (typeVal === 'image' || mediaUrl) finalContentType = 'post';
        else finalContentType = 'tweet';
    }

    // Determine isLongForm
    const isLongForm = finalContentType === 'video';

    const postData = {
      authorId: req.user.id,
      content,
      contentType: finalContentType,
      category: category || 'general',
      type: typeVal || (finalContentType === 'tweet' ? 'text' : (finalContentType === 'post' ? 'image' : 'video')),
      mediaUrl,
      videoLength: videoLength || 0,
      isLongForm,
      mentions,
      hashtags,
      parentPostId
    };

    if (startupId) {
      // Verify user owns the startup
      const startup = await Startup.findById(startupId);
      if (!startup) {
        return res.status(404).json({ success: false, error: 'Startup not found' });
      }
      if (startup.founderId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to post for this startup' });
      }
      postData.startupId = startupId;
    }

    const post = await Post.create(postData);

    // Notify mentioned users
    for (const userId of mentions) {
      await createNotification({
        recipient: userId,
        sender: req.user.id,
        type: 'mention',
        entityId: post._id,
        entityType: 'Post',
        content: content.substring(0, 50)
      }, req.app.get('io'));
    }

    // Notify parent post author if it's a reply
    if (parentPostId) {
      const parentPost = await Post.findById(parentPostId);
      if (parentPost) {
        parentPost.comments.push(post._id);
        await parentPost.save();

        await createNotification({
          recipient: parentPost.authorId,
          sender: req.user.id,
          type: 'reply',
          entityId: post._id,
          entityType: 'Post',
          content: content.substring(0, 50)
        }, req.app.get('io'));
      }
    }

    // Populate author details immediately
    await post.populate('authorId', 'name username profileImage role verificationBadge');
    if (startupId) {
      await post.populate('startupId', 'name logo');
    }
    if (parentPostId) {
      await post.populate({
        path: 'parentPostId',
        populate: { path: 'authorId', select: 'name username profileImage' }
      });
    }

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Investor Reaction
// @route   POST /api/posts/:id/react
// @access  Private (Investor Only)
exports.investorReact = async (req, res) => {
  try {
    const { type } = req.body; // 'interested', 'want_to_invest', 'request_deck'
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (req.user.role !== 'investor') {
      return res.status(403).json({ success: false, error: 'Only investors can react' });
    }

    // Check if already reacted
    const existingIndex = post.investorReactions.findIndex(r => r.investorId.toString() === req.user.id);
    if (existingIndex > -1) {
      // Update existing
      post.investorReactions[existingIndex].type = type;
    } else {
      // Add new
      post.investorReactions.push({ investorId: req.user.id, type });
    }

    await post.save();

    // Notify author
    await createNotification({
      recipient: post.authorId,
      sender: req.user.id,
      type: 'investor_interest',
      entityId: post._id,
      entityType: 'Post',
      content: type.replace(/_/g, ' ')
    }, req.app.get('io'));

    res.status(200).json({ success: true, data: post.investorReactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get trending hashtags
// @route   GET /api/posts/trending
// @access  Public
exports.getTrendingHashtags = async (req, res) => {
  try {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 7);

    const trending = await Post.aggregate([
      { $match: { createdAt: { $gte: dateLimit }, hashtags: { $exists: true, $ne: [] } } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: trending
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get posts by hashtag
// @route   GET /api/posts/hashtag/:tag
// @access  Public
exports.getPostsByHashtag = async (req, res) => {
  try {
    const tag = req.params.tag;
    const posts = await Post.find({ hashtags: tag })
      .populate('authorId', 'name username profileImage role verificationBadge')
      .populate('startupId', 'name logo industry')
      .populate({
        path: 'repostOf',
        populate: { path: 'authorId', select: 'name username profileImage' }
      })
      .populate({
        path: 'parentPostId',
        populate: { path: 'authorId', select: 'name username profileImage' }
      })
      .sort({ createdAt: -1 });

    const postsWithStatus = posts.map(post => post.toPublicJSON(req.user ? req.user.id : null));

    res.status(200).json({
      success: true,
      count: posts.length,
      data: postsWithStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all posts (Feed)
// @route   GET /api/posts
// @access  Public
exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Build query
    let query = {};
    if (req.query.parentPostId) {
      query.parentPostId = req.query.parentPostId;
    } else {
      query.$or = [
        { parentPostId: null },
        { parentPostId: { $exists: false } }
      ];
    }
    
    // Filter by type if provided
     if (req.query.type === 'video') {
         // Watch Page: Only long-form videos
         query.contentType = 'video';
     } else if (req.query.type) {
         // Specific type requested (e.g. searching for tweets only)
         query.type = req.query.type;
     } else {
         // Main Feed: Exclude long-form videos (Watch content)
         // Matches: tweet, post, vtweet, and legacy content (where contentType is undefined)
         query.contentType = { $ne: 'video' };
     }
    
    // Filter by author role
    if (req.query.authorRole) {
      const users = await User.find({ role: req.query.authorRole }).select('_id');
      const userIds = users.map(u => u._id);
      query.authorId = { $in: userIds };
    }

    // Filter by linked startup
    if (req.query.hasStartup === 'true') {
      query.startupId = { $ne: null };
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    console.log('GET /posts Query:', JSON.stringify(query));
    
    // Filter by startup if provided
    if (req.query.startupId) {
      query.startupId = req.query.startupId;
    }

    // Filter by author if provided
    if (req.query.authorId) {
      query.authorId = req.query.authorId;
    }

    // Filter by following
    if (req.query.following === 'true') {
      if (!req.user) {
         return res.status(401).json({ success: false, error: 'Please login to see following feed' });
      }
      const user = await User.findById(req.user.id);
      query.authorId = { $in: user.following };
    }

    // Sort logic
    let sort = { createdAt: -1 };
    if (req.query.sort === 'trending') {
       sort = { 'metrics.engagement': -1, createdAt: -1 };
    }

    const total = await Post.countDocuments(query);

    const posts = await Post.find(query)
      .populate('authorId', 'name username profileImage role verificationBadge')
      .populate('startupId', 'name logo industry')
      .populate({
        path: 'repostOf',
        populate: { path: 'authorId', select: 'name username profileImage' }
      })
      .populate({
        path: 'parentPostId',
        populate: { path: 'authorId', select: 'name username profileImage' }
      })
      .sort(sort)
      .skip(startIndex)
      .limit(limit);

    const postsWithStatus = posts.map(post => post.toPublicJSON(req.user ? req.user.id : null));

    res.status(200).json({
      success: true,
      count: posts.length,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      data: postsWithStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
exports.getPost = async (req, res) => {
  try {
    console.log('GET POST request for:', req.params.id);
    const post = await Post.findById(req.params.id)
      .populate('authorId', 'name profileImage role verificationBadge username')
      .populate('startupId', 'name logo')
      .populate({
        path: 'repostOf',
        populate: { path: 'authorId', select: 'name username profileImage' }
      })
      .populate({
        path: 'parentPostId',
        populate: { path: 'authorId', select: 'name username profileImage' }
      });

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Get replies (posts with this parentPostId)
    const replies = await Post.find({ parentPostId: req.params.id })
      .populate('authorId', 'name profileImage role verificationBadge username')
      .populate({
        path: 'repostOf',
        populate: { path: 'authorId', select: 'name username profileImage' }
      })
      .populate({
        path: 'parentPostId',
        populate: { path: 'authorId', select: 'name username profileImage' }
      })
      .sort({ createdAt: 1 });

    console.log('Converting post to public JSON...');
    const userId = req.user ? req.user.id : null;
    const postData = post.toPublicJSON(userId);
    console.log('Post converted.');
    
    // Attach replies to response
    const repliesData = replies.map(r => r.toPublicJSON(userId));

    res.status(200).json({
      success: true,
      data: {
        ...postData,
        replies: repliesData
      }
    });
  } catch (error) {
    console.error('ERROR IN GET POST:', error);
    res.status(500).json({ success: false, error: `Server Error: ${error.message}` });
  }
};

// @desc    Toggle Save Post
// @route   PUT /api/posts/:id/save
// @access  Private
exports.toggleSavePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (post.isSavedBy(req.user.id)) {
      await post.removeSave(req.user.id);
    } else {
      await post.addSave(req.user.id);
    }

    res.status(200).json({
      success: true,
      data: {
        saves: post.saves,
        saveCount: post.saveCount,
        isSavedBy: post.isSavedBy(req.user.id)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @route   PUT /api/posts/:id/like
// @access  Private
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    // Check if post has already been liked
    if (post.isLikedBy(req.user.id)) {
      await post.removeLike(req.user.id);
    } else {
      await post.addLike(req.user.id);
    }

    res.status(200).json({
      success: true,
      data: {
        likes: post.likes,
        likeCount: post.likeCount
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Report a post
// @route   POST /api/posts/:id/report
// @access  Private
exports.reportPost = async (req, res) => {
  try {
    const { reason } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    if (!post.reports) {
      post.reports = [];
    }

    const alreadyReported = post.reports.some(
      r => r.userId.toString() === req.user.id.toString()
    );

    if (alreadyReported) {
      return res.status(400).json({ success: false, error: 'You have already reported this post' });
    }

    post.reports.push({
      userId: req.user.id,
      reason: reason || 'No reason provided'
    });

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post reported successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
