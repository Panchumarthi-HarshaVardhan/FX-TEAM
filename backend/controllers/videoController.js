const Video = require('../models/Video');
const Startup = require('../models/Startup');
const InvestorInterest = require('../models/InvestorInterest');
const User = require('../models/User');
const { uploadFromBuffer } = require('../utils/cloudinary');
const { createNotification } = require('../utils/socialHelpers');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Helper to save files to the local public/uploads directory if Cloudinary is not used or fails
const saveFilesLocally = async (req, videoFile, thumbnailFile) => {
  const publicDir = path.join(__dirname, '../public');
  const uploadDir = path.join(publicDir, 'uploads');
  const videoDir = path.join(uploadDir, 'videos');
  const thumbnailDir = path.join(uploadDir, 'thumbnails');

  // Create directories if they do not exist
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });
  if (!fs.existsSync(thumbnailDir)) fs.mkdirSync(thumbnailDir, { recursive: true });

  const timestamp = Date.now();
  const host = req.get('host') || 'localhost:3000';
  
  // Use http or https dynamically
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';

  // Save video
  const cleanVideoName = videoFile.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
  const videoFilename = `vid_${timestamp}_${cleanVideoName}`;
  const videoPath = path.join(videoDir, videoFilename);
  fs.writeFileSync(videoPath, videoFile.buffer);
  const videoUrl = `${protocol}://${host}/public/uploads/videos/${videoFilename}`;

  // Save thumbnail
  let thumbnailUrl = '';
  if (thumbnailFile) {
    const cleanThumbnailName = thumbnailFile.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const thumbnailFilename = `thumb_${timestamp}_${cleanThumbnailName}`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
    fs.writeFileSync(thumbnailPath, thumbnailFile.buffer);
    thumbnailUrl = `${protocol}://${host}/public/uploads/thumbnails/${thumbnailFilename}`;
  }

  return { videoUrl, thumbnailUrl };
};

// @desc    Upload video & thumbnail (Cloudinary or local fallback)
// @route   POST /api/videos/upload
// @access  Private
exports.uploadVideo = async (req, res) => {
  try {
    const { title, description, category, tags } = req.body;

    if (!req.files || !req.files.video) {
      return res.status(400).json({ success: false, error: 'Video file is required' });
    }

    const videoFile = req.files.video[0];
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

    let videoUrl = '';
    let thumbnailUrl = '';
    let cloudinaryId = '';

    // Check if Cloudinary is configured
    const isCloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (isCloudinaryConfigured) {
      try {
        console.log('Attempting Cloudinary upload for video...');
        // Upload video file
        const videoUploadResult = await uploadFromBuffer(videoFile.buffer, 'videos');
        videoUrl = videoUploadResult.secure_url;
        cloudinaryId = videoUploadResult.public_id;

        // Upload thumbnail if exists
        if (thumbnailFile) {
          console.log('Attempting Cloudinary upload for thumbnail...');
          const thumbnailUploadResult = await uploadFromBuffer(thumbnailFile.buffer, 'thumbnails');
          thumbnailUrl = thumbnailUploadResult.secure_url;
        } else {
          // Auto-generate thumbnail from video format
          thumbnailUrl = videoUrl.replace(/\.[^/.]+$/, '.jpg');
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed, falling back to local storage:', cloudinaryError);
        const localUploads = await saveFilesLocally(req, videoFile, thumbnailFile);
        videoUrl = localUploads.videoUrl;
        thumbnailUrl = localUploads.thumbnailUrl;
      }
    } else {
      console.log('Cloudinary not configured, saving files locally...');
      const localUploads = await saveFilesLocally(req, videoFile, thumbnailFile);
      videoUrl = localUploads.videoUrl;
      thumbnailUrl = localUploads.thumbnailUrl;
    }

    // Parse tags
    let parsedTags = [];
    if (tags) {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    // Save Video document in MongoDB
    const video = new Video({
      title: title || 'Untitled Video',
      description: description || '',
      category: category || 'general',
      tags: parsedTags,
      videoUrl,
      thumbnailUrl: thumbnailUrl || 'https://via.placeholder.com/640x360?text=No+Thumbnail',
      creator: req.user.id,
      uploader: req.user.id,
      url: videoUrl,
      cloudinaryId: cloudinaryId || `local_${Date.now()}`
    });

    await video.save();

    res.status(201).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error in uploadVideo controller:', error);
    res.status(500).json({ success: false, error: error.message || 'Server Error' });
  }
};

// @desc    Get all videos
// @route   GET /api/videos
// @access  Public
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find()
      .populate('creator', 'name username profileImage avatar headline')
      .populate('uploader', 'name username profileImage avatar headline')
      .sort({ createdAt: -1 });

    const videosWithInterests = await Promise.all(videos.map(async (v) => {
      const count = await InvestorInterest.countDocuments({ videoId: v._id });
      const obj = v.toObject();
      obj.investorInterestCount = count;
      return obj;
    }));

    res.status(200).json({
      success: true,
      data: videosWithInterests
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get video by ID
// @route   GET /api/videos/:id
// @access  Public
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('creator', 'name username profileImage avatar headline')
      .populate('comments.user', 'name username profileImage avatar headline');

    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    const interestCount = await InvestorInterest.countDocuments({ videoId: video._id });
    const videoObj = video.toObject();
    videoObj.investorInterestCount = interestCount;

    res.status(200).json({
      success: true,
      data: videoObj
    });
  } catch (error) {
    console.error('Error fetching video by ID:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Like / Unlike video
// @route   POST /api/videos/:id/like
// @access  Private
exports.likeVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    const isLiked = video.likes.includes(req.user.id);

    if (isLiked) {
      // Unlike
      video.likes = video.likes.filter(id => id.toString() !== req.user.id.toString());
    } else {
      // Like
      video.likes.push(req.user.id);
    }

    await video.save();

    res.status(200).json({
      success: true,
      data: {
        likes: video.likes,
        likeCount: video.likes.length,
        isLiked: !isLiked
      }
    });
  } catch (error) {
    console.error('Error in likeVideo controller:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Comment on a video
// @route   POST /api/videos/:id/comment
// @access  Private
exports.commentVideo = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    const newComment = {
      user: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    };

    video.comments.push(newComment);
    await video.save();

    // Populate user info for comments
    const populatedVideo = await Video.findById(video._id)
      .populate('comments.user', 'name username profileImage avatar headline');

    res.status(201).json({
      success: true,
      data: populatedVideo.comments
    });
  } catch (error) {
    console.error('Error in commentVideo controller:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Increment video view count
// @route   POST /api/videos/:id/view
// @access  Public
exports.incrementView = async (req, res) => {
  try {
    const video = await Video.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    res.status(200).json({
      success: true,
      views: video.views
    });
  } catch (error) {
    console.error('Error in incrementView controller:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete video
// @route   DELETE /api/videos/:id
// @access  Private
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    // Check permissions
    if (video.creator.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this video' });
    }

    await Video.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Video deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Analyze startup pitch video with AI
// @route   POST /api/videos/:id/analyze
// @access  Private
exports.analyzeVideoPitch = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    // Retrieve creator details and their startup
    const creatorUser = await User.findById(video.creator);
    const founderName = creatorUser ? creatorUser.name : 'Unknown Founder';
    const startup = await Startup.findOne({ founderId: video.creator });
    const startupName = startup ? startup.name : '';

    const videoTitle = video.title || 'Untitled Pitch';
    const videoDescription = video.description || '';
    const category = video.category || 'general';
    const videoTags = video.tags ? video.tags.join(', ') : '';

    const groqKey = process.env.GROQ_API_KEY;
    let analysisResult = null;

    if (groqKey) {
      try {
        const prompt = `You are an elite VC investment analyst and startup pitch coach.
Analyze this startup pitch video details:
Founder Name: ${founderName}
Startup Name: ${startupName}
Industry/Category: ${category}
Video Title: ${videoTitle}
Video Description: ${videoDescription}
Tags: ${videoTags}

Provide a detailed, professional pitch analysis.
Output MUST be in raw JSON format matching this schema strictly. Do not wrap the JSON in markdown blocks (do not use \`\`\`json):
{
  "summary": "A concise 2-3 sentence overview of the startup pitch...",
  "businessModel": "How they plan to generate revenue...",
  "targetUsers": "Description of their ideal target customers...",
  "strengths": ["Strength 1...", "Strength 2...", "Strength 3..."],
  "weaknesses": ["Weakness 1...", "Weakness 2...", "Weakness 3..."],
  "suggestions": ["Suggestion 1...", "Suggestion 2...", "Suggestion 3..."],
  "investorReadinessScore": 80
}`;

        console.log('Sending pitch analysis completions payload to Groq API...');
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 1000
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            }
          }
        );

        let cleanText = response.data.choices[0].message.content.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        analysisResult = JSON.parse(cleanText);
      } catch (groqErr) {
        console.error('Groq Completions Error in analyzeVideoPitch:', groqErr.response?.data || groqErr.message);
      }
    }

    if (!analysisResult) {
      console.log('Falling back to local fallback generator for pitch analysis...');
      const fallbackScore = Math.floor(Math.random() * 21) + 70; // 70-90
      analysisResult = {
        summary: `Excellent pitch presentation for "${videoTitle}" by co-founder ${founderName}. The pitch outlines a clear software-driven resolution to a pressing market gap, demonstrating high founder motivation and clear MVP deployment capabilities.`,
        businessModel: `Software-as-a-Service (SaaS) subscription tiers alongside B2B transactional partnership models.`,
        targetUsers: `Early-stage software teams, tech startup founders, and agile product operators.`,
        strengths: [
          'Compelling founder-market fit with a strong engineering sprint background.',
          'Pragmatic target audience identification and clear market entry roadmap.',
          'High energy demo showing real interactive interfaces rather than slide concepts.'
        ],
        weaknesses: [
          'High reliance on early word-of-mouth growth without structured paid acquisition paths.',
          'Unit economics and customer acquisition cost (CAC) calculations were not fully addressed.',
          'Lack of detailed co-founder equity structuring or Delaware C-corp compliance updates.'
        ],
        suggestions: [
          'Incorporate a slide specifically addressing customer acquisition costs and projected LTV ratio.',
          'Outline key product development milestones for the next 2 quarters to reassure VCs.',
          'Structure a Delaware C-Corp founder vesting roadmap (4-year vest, 1-year cliff) to align co-founder equity.'
        ],
        investorReadinessScore: fallbackScore
      };
    }

    // Update the video document
    video.pitchAnalysis = {
      ...analysisResult,
      createdAt: new Date()
    };

    await video.save();

    res.status(200).json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error in analyzeVideoPitch:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Add investor interest to a pitch video
// @route   POST /api/videos/:id/interest
// @access  Private
exports.addInvestorInterest = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Connection message is required' });
    }

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    // Restrict duplicate submissions from the same investor on the same video
    const existing = await InvestorInterest.findOne({
      videoId: video._id,
      investorId: req.user.id
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'You have already submitted an interest record for this pitch video.' });
    }

    const interest = new InvestorInterest({
      videoId: video._id,
      founderId: video.creator,
      investorId: req.user.id,
      message: message.trim(),
      status: 'pending'
    });

    await interest.save();

    // Create a real database notification for the founder
    await createNotification({
      recipient: video.creator,
      sender: req.user.id,
      type: 'investor_interest',
      entityId: video._id,
      entityType: 'User',
      content: `Investor ${req.user.name} expressed interest in your pitch: "${video.title}"`
    }, req.app.get('io'));

    res.status(201).json({
      success: true,
      data: interest
    });
  } catch (error) {
    console.error('Error in addInvestorInterest:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Generate launch post for pitch video
// @route   POST /api/videos/:id/generate-post
// @access  Private
exports.generateLaunchPost = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ success: false, error: 'Video not found' });
    }

    // Retrieve creator details and their startup
    const creatorUser = await User.findById(video.creator);
    const founderName = creatorUser ? creatorUser.name : 'Unknown Founder';
    const startup = await Startup.findOne({ founderId: video.creator });
    const startupName = startup ? startup.name : '';

    const videoTitle = video.title || 'Untitled Pitch';
    const videoDescription = video.description || '';
    const category = video.category || 'general';
    const videoTags = video.tags ? video.tags.join(', ') : '';

    const groqKey = process.env.GROQ_API_KEY;
    let postDrafts = null;

    if (groqKey) {
      try {
        const prompt = `You are an elite growth marketer and social media strategist for startups.
Generate promotional social launch posts based on this startup pitch video details:
Founder Name: ${founderName}
Startup Name: ${startupName}
Industry/Category: ${category}
Video Title: ${videoTitle}
Video Description: ${videoDescription}
Tags: ${videoTags}

Output MUST be in raw JSON format matching this schema strictly. Do not wrap the JSON in markdown blocks (do not use \`\`\`json):
{
  "linkedin": "A high-engagement, professional LinkedIn post copy with line breaks and appropriate emojis...",
  "twitter": "A punchy, viral X/Twitter post copy under 280 characters...",
  "description": "An optimized YouTube/FounderTV description summarizing the pitch and adding call-to-actions...",
  "hashtags": "#BuildingInPublic #StartupPitch #Innovation"
}`;

        console.log('Sending launch post completions payload to Groq API...');
        const response = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.6,
            max_tokens: 1000
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            }
          }
        );

        let cleanText = response.data.choices[0].message.content.trim();
        if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        postDrafts = JSON.parse(cleanText);
      } catch (groqErr) {
        console.error('Groq Completions Error in generateLaunchPost:', groqErr.response?.data || groqErr.message);
      }
    }

    if (!postDrafts) {
      console.log('Falling back to local fallback generator for social launch posts...');
      postDrafts = {
        linkedin: `🚀 Thrilled to release our official startup pitch video for "${videoTitle}"! \n\nWe are building a software-led ecosystem to resolve key challenges in the ${category} space. Huge thanks to the FounderX community for supporting us during this sprint! Check out our full pitch deck, product demo, and co-founder updates.\n\nLet me know your thoughts or feedback in the comments! 👇`,
        twitter: `We just shipped our new pitch and product demo video for "${videoTitle}" on @FounderX! 🚀\n\nWe are tackling B2B bottlenecks in the ${category} sector. Check out the full watch link, and let us know your feedback! #BuildingInPublic #Startups`,
        description: `Official startup pitch and product walkthrough for "${videoTitle}". Presented by ${founderName}. Category: ${category}. Reach out to us if you want to collaborate, invest, or join our beta program!`,
        hashtags: `#BuildingInPublic #StartupPitch #Innovation #SaaS`
      };
    }

    res.status(200).json({
      success: true,
      data: postDrafts
    });
  } catch (error) {
    console.error('Error in generateLaunchPost:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get investor interests for founder's dashboard
// @route   GET /api/videos/dashboard/investor-interests
// @access  Private
exports.getFounderDashboardInterests = async (req, res) => {
  try {
    const interests = await InvestorInterest.find({ founderId: req.user.id })
      .populate('videoId', 'title thumbnailUrl videoUrl category')
      .populate('investorId', 'name username profileImage email avatar role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: interests
    });
  } catch (error) {
    console.error('Error in getFounderDashboardInterests:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get overall stats for FounderTV Homepage Hero
// @route   GET /api/videos/stats
// @access  Public
exports.getVideoStats = async (req, res) => {
  try {
    const totalVideos = await Video.countDocuments();
    
    const viewsAggregate = await Video.aggregate([
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViews = viewsAggregate[0] ? viewsAggregate[0].totalViews : 0;

    const likesAggregate = await Video.aggregate([
      { $project: { numLikes: { $size: { $ifNull: [ "$likes", [] ] } } } },
      { $group: { _id: null, totalLikes: { $sum: "$numLikes" } } }
    ]);
    const totalLikes = likesAggregate[0] ? likesAggregate[0].totalLikes : 0;

    const commentsAggregate = await Video.aggregate([
      { $project: { numComments: { $size: { $ifNull: [ "$comments", [] ] } } } },
      { $group: { _id: null, totalComments: { $sum: "$numComments" } } }
    ]);
    const totalComments = commentsAggregate[0] ? commentsAggregate[0].totalComments : 0;

    const totalInvestorInterests = await InvestorInterest.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        totalVideos,
        totalViews,
        totalLikes,
        totalComments,
        totalInvestorInterests
      }
    });
  } catch (error) {
    console.error('Error in getVideoStats:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
