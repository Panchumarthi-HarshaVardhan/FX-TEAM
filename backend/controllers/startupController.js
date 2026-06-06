const Startup = require('../models/Startup');
const Post = require('../models/Post');
const Application = require('../models/Application');
const InvestmentRequest = require('../models/InvestmentRequest');
const Report = require('../models/Report');
const User = require('../models/User');
const { mongooseCompat: mongoose } = require('../utils/firebaseModel');
const FounderProfile = require('../models/FounderProfile');
const Follow = require('../models/Follow');
const SavedItem = require('../models/SavedItem');
const Mail = require('../models/Mail');
const axios = require('axios');
const StartupRoleRequest = require('../models/StartupRoleRequest');
const StartupTeamMember = require('../models/StartupTeamMember');




// @desc    Get Startup Badge (SVG) and Track View
// @route   GET /api/startups/:id/badge
// @access  Public
exports.getStartupBadge = async (req, res) => {
  try {
    let startup;
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);

    if (isObjectId) {
      startup = await Startup.findById(req.params.id);
    } else {
      startup = await Startup.findOne({ slug: req.params.id });
    }

    if (!startup) {
      // Return a generic badge if not found, or 404
      // For user experience, better to return generic than broken image
      return res.status(404).send('Startup Not Found');
    }

    // Increment badge views
    startup.badgeViews = (startup.badgeViews || 0) + 1;
    await startup.save({ validateBeforeSave: false }); // Skip validation for speed

    // Generate SVG Badge
    const width = 200;
    const height = 60;
    const color = '#2563EB'; // Blue-600
    
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" rx="10" fill="white" stroke="${color}" stroke-width="2"/>
        <text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6B7280">Built on</text>
        <text x="50%" y="70%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="${color}">FounderX</text>
      </svg>
    `;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(svg);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error');
  }
};

// @desc    Create a new startup
// @route   POST /api/startups
// @access  Private (Founder only)
const { createNotification } = require('../utils/socialHelpers');

exports.createStartup = async (req, res) => {
  try {
    // Add user to req.body
    req.body.founderId = req.user.id;

    if (!req.body.contactEmail && req.user && req.user.email) {
      req.body.contactEmail = req.user.email;
    }

    // Check for existing startup for this user if needed (optional rule)
    // const publishedStartup = await Startup.findOne({ founderId: req.user.id });
    // if (publishedStartup && req.user.role !== 'admin') {
    //   return res.status(400).json({ success: false, error: 'You have already published a startup' });
    // }

    const startup = await Startup.create(req.body);

    // Link startup to FounderProfile
    let founderProfile = await FounderProfile.findOne({ userId: req.user.id });
    if (!founderProfile) {
      founderProfile = new FounderProfile({ userId: req.user.id });
    }
    if (!founderProfile.startups.includes(startup._id)) {
      founderProfile.startups.push(startup._id);
    }
    await founderProfile.save();

    res.status(201).json({
      success: true,
      data: startup
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// Helper function to evaluate role-based permissions for a startup
const getStartupPermissions = async (startup, user) => {
  const defaultPerms = {
    canView: true,
    canFollow: false,
    canSave: false,
    canViewJobs: true,
    canApply: false,
    canMessageFounder: false,
    canInvest: false,
    canManage: false,
    canEdit: false
  };

  if (!user) return defaultPerms;

  const isOwner = startup.founderId.toString() === user._id.toString();
  const isTeamMember = startup.teamMembers && startup.teamMembers.some(member => member.userId && member.userId.toString() === user._id.toString());

  // Check follow status
  let isFollowing = false;
  if (startup.followers) {
    isFollowing = startup.followers.some(id => id.toString() === user._id.toString());
  }

  // Check saved status
  let isSaved = false;
  if (startup.saves) {
    isSaved = startup.saves.some(save => save.userId.toString() === user._id.toString());
  }

  // Check mutual follow: if user follows founder and founder follows user
  let isMutualFollow = false;
  try {
    const founder = await User.findById(startup.founderId);
    if (founder) {
      const userFollowsFounder = founder.followers && founder.followers.some(id => id.toString() === user._id.toString());
      const founderFollowsUser = user.followers && user.followers.some(id => id.toString() === founder._id.toString());
      isMutualFollow = userFollowsFounder && founderFollowsUser;
    }
  } catch (err) {
    console.error('Mutual follow check error:', err);
  }

  if (user.role === 'user' || user.role === 'job_seeker') {
    // Check if there is an accepted job application by this job seeker for this startup
    let hasAcceptedApplication = false;
    try {
      const app = await Application.findOne({
        startupId: startup._id,
        applicantId: user._id,
        status: { $in: ['connected', 'accepted', 'hired'] }
      });
      hasAcceptedApplication = !!app;

      if (!hasAcceptedApplication) {
        const JobApplication = require('../models/JobApplication');
        const jobApp = await JobApplication.findOne({
          startupId: startup._id,
          applicantId: user._id,
          status: { $in: ['connected', 'accepted', 'hired'] }
        });
        hasAcceptedApplication = !!jobApp;
      }

      if (!hasAcceptedApplication) {
        const roleReq = await StartupRoleRequest.findOne({
          startupId: startup._id,
          applicantId: user._id,
          status: { $in: ['connected', 'accepted', 'hired'] }
        });
        hasAcceptedApplication = !!roleReq;
      }
    } catch (err) {
      console.error('Job application check error:', err);
    }

    const JobOpening = require('../models/JobOpening');
    let hasJobs = startup.jobs && startup.jobs.length > 0;
    if (!hasJobs) {
      try {
        const count = await JobOpening.countDocuments({ startupId: startup._id, status: 'open' });
        hasJobs = count > 0;
      } catch (err) {
        console.error('Error counting jobs:', err);
      }
    }

    const canMessage = hasAcceptedApplication || isMutualFollow || isTeamMember;

    return {
      canView: true,
      canFollow: true,
      canFollowed: isFollowing, // current status
      canSave: true,
      canSaved: isSaved, // current status
      canViewJobs: true,
      canApply: hasJobs,
      canMessageFounder: canMessage,
      canInvest: false,
      canManage: false,
      canEdit: false
    };
  }

  if (user.role === 'investor') {
    // Check if there is an accepted investment request / interest
    let hasAcceptedInterest = false;
    try {
      const interest = await InvestmentRequest.findOne({
        startupId: startup._id,
        investorId: user._id,
        status: 'accepted'
      });
      hasAcceptedInterest = !!interest;
    } catch (err) {
      console.error('Investment interest check error:', err);
    }

    const canMessage = hasAcceptedInterest || isMutualFollow;

    return {
      canView: true,
      canFollow: true,
      canFollowed: isFollowing,
      canSave: true,
      canSaved: isSaved,
      canViewJobs: false,
      canApply: false,
      canMessageFounder: canMessage,
      canInvest: true,
      canManage: false,
      canEdit: false
    };
  }

  if (user.role === 'founder') {
    return {
      canView: true,
      canFollow: true,
      canFollowed: isFollowing,
      canSave: true,
      canSaved: isSaved,
      canViewJobs: true,
      canApply: false,
      canMessageFounder: isMutualFollow || isOwner || isTeamMember,
      canInvest: false,
      canManage: isOwner,
      canEdit: isOwner
    };
  }

  return defaultPerms;
};

// @desc    Get all startups
// @route   GET /api/startups
// @access  Public
exports.getStartups = async (req, res) => {
  try {
    const queryObj = {};

    // Only show public and active startups
    queryObj.is_public = true;
    queryObj.is_active = true;

    // Search functionality
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      
      // Find matching users for founder name search
      const matchingUsers = await mongoose.model('User').find({
        name: searchRegex
      }).select('_id');
      const matchingUserIds = matchingUsers.map(u => u._id);

      const searchConditions = [
        { name: searchRegex },
        { oneLinePitch: searchRegex },
        { description: searchRegex },
        { industry: searchRegex },
        { stage: searchRegex },
        { 'location.city': searchRegex },
        { 'location.country': searchRegex }
      ];

      if (matchingUserIds.length > 0) {
        searchConditions.push({ founderId: { $in: matchingUserIds } });
      }

      if (req.query.search.toLowerCase() === 'remote') {
        searchConditions.push({ 'location.remote': true });
      }

      queryObj.$or = searchConditions;
    }

    // Filter by Industry
    if (req.query.industry && req.query.industry !== 'All') {
      queryObj.industry = { $regex: new RegExp('^' + req.query.industry + '$', 'i') };
    }

    // Filter by Stage
    if (req.query.stage && req.query.stage !== 'All') {
      queryObj.stage = req.query.stage.toLowerCase();
    }

    // Filter by Location
    if (req.query.location && req.query.location.trim() !== '') {
      const locRegex = { $regex: req.query.location, $options: 'i' };
      const locationConditions = [
        { 'location.city': locRegex },
        { 'location.country': locRegex }
      ];
      if (req.query.location.toLowerCase() === 'remote') {
        locationConditions.push({ 'location.remote': true });
      }
      queryObj.$and = queryObj.$and || [];
      queryObj.$and.push({ $or: locationConditions });
    }

    // Filter by Verified
    if (req.query.verified === 'true') {
      queryObj.$and = queryObj.$and || [];
      queryObj.$and.push({
        $or: [
          { verified: true },
          { isVerified: true },
          { is_verified: true }
        ]
      });
    }

    // If queryObj.$and is empty, delete it
    if (queryObj.$and && queryObj.$and.length === 0) {
      delete queryObj.$and;
    }

    // Let's create query
    let query = Startup.find(queryObj).populate('founderId', 'name email profileImage');

    // Sorting (except most_followed which is done in memory after population)
    const sortVal = req.query.sort;
    if (sortVal === 'most_viewed') {
      query = query.sort('-metrics.views');
    } else if (sortVal === 'recently_created') {
      query = query.sort('-createdAt');
    } else if (sortVal && sortVal !== 'most_followed') {
      const sortBy = sortVal.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 1000; // default to 1000 so all show up!
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Startup.countDocuments(queryObj);

    query = query.skip(startIndex).limit(limit);

    const startups = await query;

    // Convert to public JSON with permissions
    let startupsWithStatus = await Promise.all(startups.map(async (startup) => {
      const publicStartup = startup.toPublicJSON(req.user ? req.user : null);
      const permissions = await getStartupPermissions(startup, req.user);
      return {
        ...publicStartup,
        startup: publicStartup,
        permissions
      };
    }));

    // In-memory sort for most_followed (needs followerCount from public JSON or followers length)
    if (sortVal === 'most_followed') {
      startupsWithStatus.sort((a, b) => {
        const aCount = a.followerCount || 0;
        const bCount = b.followerCount || 0;
        return bCount - aCount;
      });
    } else if (sortVal === 'most_viewed') {
      // Just in case Mongoose sorting by nested fields isn't reliable, sort here too
      startupsWithStatus.sort((a, b) => {
        const aViews = (a.metrics && a.metrics.views) || 0;
        const bViews = (b.metrics && b.metrics.views) || 0;
        return bViews - aViews;
      });
    } else if (sortVal === 'recently_created') {
      startupsWithStatus.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: startupsWithStatus.length,
      pagination,
      data: startupsWithStatus
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

// Helper to build AI Filter Prompt
function buildAIFilterPrompt(userQuery) {
  return `You are an AI filter converter for a startup platform. Your job is to convert a natural language search query into a structured JSON filter object for searching startups.

User Query: "${userQuery}"

Allowed Industries (if specified, map to one of these or leave as is if not matching):
"Technology", "Healthcare", "Finance", "Education", "E-commerce", "SaaS", "AI/ML", "Blockchain", "CleanTech", "FoodTech", "Fashion", "Real Estate", "Transportation", "Other"

Allowed Stages:
"idea", "mvp", "first_customer", "revenue", "funded"

Allowed Sort values:
"recently_created", "most_viewed", "most_followed"

Output a strictly valid JSON object (and nothing else) in the following format:
{
  "industry": string | null, // e.g. "AI/ML", "Finance", or null if not specified
  "stage": string | null, // must be one of "idea", "mvp", "first_customer", "revenue", "funded", or null
  "location": string | null, // location string like a city/country/remote, or null
  "verified": boolean | null, // true if user requested verified/approved startups, false/null otherwise
  "sort": string | null, // "recently_created", "most_viewed", "most_followed", or null
  "search": string | null // any remaining keywords to search for in startup name/founder/pitch, or null
}

Examples:
- "show fintech startups in idea stage":
  {"industry": "Finance", "stage": "idea", "location": null, "verified": null, "sort": null, "search": null}
- "show startups looking for investors":
  {"industry": null, "stage": null, "location": null, "verified": null, "sort": null, "search": "investors"}
- "show verified AI startups":
  {"industry": "AI/ML", "stage": null, "location": null, "verified": true, "sort": null, "search": null}
- "show startups created recently":
  {"industry": null, "stage": null, "location": null, "verified": null, "sort": "recently_created", "search": null}
- "SaaS startups in remote location":
  {"industry": "SaaS", "stage": null, "location": "remote", "verified": null, "sort": null, "search": null}
- "most viewed healthcare startups":
  {"industry": "Healthcare", "stage": null, "location": null, "verified": null, "sort": "most_viewed", "search": null}

Return ONLY the raw JSON block. Do not include markdown formatting or extra text.`;
}

// Helper to parse JSON from text containing markdown fences
function parseJsonFromText(text) {
  let cleaned = text.replace(/\`\`\`(?:json)?\s*/gi, '').replace(/\`\`\`/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.slice(start, end + 1);
  }
  return JSON.parse(cleaned);
}

// @desc    Convert natural language query to filters
// @route   POST /api/startups/ai-filter
// @access  Public/Private
exports.aiFilterStartups = async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ success: false, error: 'Query is required' });
  }

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey || groqKey.length < 10) {
    // Fallback: return search filter with the query string itself
    return res.status(200).json({
      success: true,
      data: {
        industry: null,
        stage: null,
        location: null,
        verified: null,
        sort: null,
        search: query
      },
      fallback: true
    });
  }

  try {
    const prompt = buildAIFilterPrompt(query);
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 150
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      }
    });

    const aiText = response.data.choices[0].message.content;
    let filters = {
      industry: null,
      stage: null,
      location: null,
      verified: null,
      sort: null,
      search: query
    };

    try {
      filters = parseJsonFromText(aiText);
    } catch (parseErr) {
      console.error('Failed to parse AI response as JSON:', aiText, parseErr);
    }

    res.status(200).json({
      success: true,
      data: filters
    });
  } catch (error) {
    console.error('Groq AI filter error:', error.response?.data || error.message);
    res.status(200).json({
      success: true,
      data: {
        industry: null,
        stage: null,
        location: null,
        verified: null,
        sort: null,
        search: query
      },
      fallback: true
    });
  }
};


// @desc    Get single startup
// @route   GET /api/startups/:id
// @access  Public
exports.getStartup = async (req, res) => {
  try {
    let startup;
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);

    if (isObjectId) {
      startup = await Startup.findById(req.params.id).populate('founderId', 'name email profileImage bio followers');
    } else {
      startup = await Startup.findOne({ slug: req.params.id }).populate('founderId', 'name email profileImage bio followers');
    }

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Increment views
    try {
      await startup.incrementViews();
    } catch (err) {
      // Ignore if method fails
    }

    const permissions = await getStartupPermissions(startup, req.user);

    res.status(200).json({
      success: true,
      data: {
        ...startup.toObject(),
        permissions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};


// @desc    Toggle Save/Unsave a startup
// @route   PUT /api/startups/save/:id
// @access  Private
exports.toggleSaveStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const user = await User.findById(req.user.id);
    
    // Check if already saved
    const isSaved = user.savedStartups.includes(req.params.id);

    if (isSaved) {
      // Unsave
      user.savedStartups = user.savedStartups.filter(
        id => id.toString() !== req.params.id
      );
      
      // Remove from startup saves
      if (startup.saves) {
        startup.saves = startup.saves.filter(
          save => save.userId.toString() !== req.user.id
        );
      }
    } else {
      // Save
      user.savedStartups.push(req.params.id);
      
      // Add to startup saves
      if (!startup.saves) startup.saves = [];
      startup.saves.push({ userId: req.user.id });
    }

    await user.save();
    await startup.save();

    res.status(200).json({
      success: true,
      data: !isSaved, // true if saved, false if unsaved
      message: isSaved ? 'Startup removed from bookmarks' : 'Startup saved to bookmarks'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Report Startup
// @route   POST /api/startups/:id/report
// @access  Private
exports.reportStartup = async (req, res) => {
  try {
    const { reason, description } = req.body;
    
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const report = await Report.create({
      targetId: req.params.id,
      targetType: 'Startup',
      reporterId: req.user.id,
      reason,
      description
    });

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Startup Analytics
// @route   GET /api/startups/:id/analytics
// @access  Private (Founder only)
exports.getStartupAnalytics = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Check ownership
    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const applicationsCount = await Application.countDocuments({ startupId: req.params.id });
    const investmentRequestsCount = await InvestmentRequest.countDocuments({ startupId: req.params.id });

    // Mock data for timeline if not available
    const timeline = [
      { date: '2023-01', views: 10, applications: 0 },
      { date: '2023-02', views: 25, applications: 1 },
      { date: '2023-03', views: 40, applications: 2 },
      { date: '2023-04', views: 60, applications: 5 }
    ];

    res.status(200).json({
      success: true,
      data: {
        views: startup.metrics?.views || 0,
        investorInterest: startup.metrics?.investorInterest || 0,
        applications: applicationsCount,
        investmentRequests: investmentRequestsCount,
        timeline
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update startup
// @route   PUT /api/startups/:id
// @access  Private (Founder only)
exports.updateStartup = async (req, res) => {
  try {
    let startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Make sure user is startup owner
    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to update this startup' });
    }

    startup = await Startup.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: startup
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete startup
// @route   DELETE /api/startups/:id
// @access  Private (Founder only)
exports.deleteStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Make sure user is startup owner
    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this startup' });
    }

    await startup.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Apply for Job/Internship/Collaboration
// @route   POST /api/startups/:id/apply
// @access  Private
exports.applyToStartup = async (req, res) => {
  try {
    const { type, message, resumeUrl, portfolioUrl, collaborationDetails, jobId } = req.body;
    
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Check if already applied (simple check)
    const existingApp = await Application.findOne({
      startupId: req.params.id,
      applicantId: req.user.id,
      type: type,
      jobId: jobId // Optional
    });

    if (existingApp) {
      return res.status(400).json({ success: false, error: 'You have already applied' });
    }

    const application = await Application.create({
      startupId: req.params.id,
      applicantId: req.user.id,
      jobId,
      type,
      message,
      resumeUrl,
      portfolioUrl,
      collaborationDetails
    });

    // Notify founder (Logic for notification would go here)

    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Request Investment
// @route   POST /api/startups/:id/invest
// @access  Private (Investor only - theoretically, but we'll check role)
exports.requestInvestment = async (req, res) => {
  try {
    const { message, requestPitchDeck } = req.body;
    
    // Check role: Only investors can express interest
    if (req.user.role !== 'investor') {
      return res.status(403).json({ success: false, error: 'Only investors can send investment requests' });
    }

    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const existingRequest = await InvestmentRequest.findOne({
      startupId: req.params.id,
      investorId: req.user.id
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, error: 'You have already expressed interest' });
    }

    const request = await InvestmentRequest.create({
      startupId: req.params.id,
      investorId: req.user.id,
      message,
      requestPitchDeck
    });

    // Notify founder
    await createNotification({
      recipient: startup.founderId,
      sender: req.user.id,
      type: 'investment_request',
      entityId: request._id,
      entityType: 'InvestmentRequest',
      content: `New investment interest from ${req.user.name}`
    }, req.app.get('io'));

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Startup Applications
// @route   GET /api/startups/:id/applications
// @access  Private (Founder only)
exports.getStartupApplications = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const applications = await Application.find({ startupId: req.params.id })
      .populate('applicantId', 'name email profileImage headline')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Startup Investment Requests
// @route   GET /api/startups/:id/investment-requests
// @access  Private (Founder only)
exports.getStartupInvestmentRequests = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    const requests = await InvestmentRequest.find({ startupId: req.params.id })
      .populate('investorId', 'name email profileImage headline')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update Application Status
// @route   PUT /api/startups/applications/:id/status
// @access  Private (Founder only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body; // pending, accepted, rejected
    
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    const startup = await Startup.findById(application.startupId);
    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    application.status = status;
    await application.save();

    if (status === 'accepted') {
      // Add applicant to startup teamMembers if not already there
      const isAlreadyMember = startup.teamMembers.some(member => member.userId && member.userId.toString() === application.applicantId.toString());
      if (!isAlreadyMember) {
        const applicantUser = await User.findById(application.applicantId);
        startup.teamMembers.push({
          userId: application.applicantId,
          name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
          role: 'Team Member',
          image: applicantUser ? applicantUser.profileImage : '',
          linkedin: applicantUser?.socialLinks?.linkedin || ''
        });
        await startup.save();

        // Create StartupTeamMember collection entry
        try {
          await StartupTeamMember.create({
            startupId: startup._id,
            userId: application.applicantId,
            role: 'Team Member',
            name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
            image: applicantUser ? applicantUser.profileImage : '',
            linkedin: applicantUser?.socialLinks?.linkedin || ''
          });
        } catch (err) {
          // Ignore unique index duplicate errors
        }
      }

      // Send notification to applicant
      await createNotification({
        recipient: application.applicantId,
        sender: req.user.id,
        type: 'invite_accepted',
        entityId: application._id,
        entityType: 'Application',
        content: `Congratulations! Your job application to ${startup.name} has been accepted!`
      }, req.app.get('io'));
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
// @desc    Update Investment Request Status
// @route   PUT /api/startups/investment-requests/:id/status
// @access  Private
exports.updateInvestmentRequestStatus = async (req, res) => {
  try {
    const { status } = req.body; // pending, accepted, rejected, closed
    const InvestmentRequest = require('../models/InvestmentRequest');
    
    const request = await InvestmentRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const startup = await Startup.findById(request.startupId);
    
    // Auth check: Must be the startup founder OR the investor in the request OR an admin
    const isFounder = startup && startup.founderId.toString() === req.user.id;
    const isInvestor = request.investorId.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isFounder && !isInvestor && !isAdmin) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    request.status = status;
    await request.save();

    // Notify the other party about the update
    const recipientId = req.user.id === request.founderId.toString() ? request.investorId : request.founderId;
    const type = status === 'accepted' ? 'invite_accepted' : 'invite_rejected';
    const statusLabel = status === 'accepted' ? 'accepted' : 'rejected';
    
    await createNotification({
      recipient: recipientId,
      sender: req.user.id,
      type: type,
      entityId: request._id,
      entityType: 'InvestmentRequest',
      content: `${req.user.name} ${statusLabel} the investment request for ${startup ? startup.name : 'startup'}`
    }, req.app.get('io'));

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Follow Startup
// @route   POST /api/startups/:id/follow
// @access  Private
exports.followStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (!startup.followers) startup.followers = [];
    
    // Check if already following
    const isFollowing = startup.followers.some(id => id.toString() === req.user.id.toString());
    if (isFollowing) {
      return res.status(400).json({ success: false, error: 'You are already following this startup' });
    }

    // Add to startup followers
    startup.followers.push(req.user.id);
    await startup.save();

    // Create/update Follow record
    try {
      await Follow.create({
        followerId: req.user.id,
        followedId: startup._id,
        entityType: 'Startup'
      });
    } catch (err) {
      // Ignore uniques
    }

    // Send notification to founder
    await createNotification({
      recipient: startup.founderId,
      sender: req.user.id,
      type: 'startup_follow',
      entityId: startup._id,
      entityType: 'Startup',
      content: `${req.user.name || 'A user'} followed your startup ${startup.name}`
    }, req.app.get('io'));

    res.status(200).json({
      success: true,
      message: 'Successfully followed startup'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Unfollow Startup
// @route   DELETE /api/startups/:id/follow
// @access  Private
exports.unfollowStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (!startup.followers) startup.followers = [];

    // Check if not following
    const isFollowing = startup.followers.some(id => id.toString() === req.user.id.toString());
    if (!isFollowing) {
      return res.status(400).json({ success: false, error: 'You are not following this startup' });
    }

    // Remove from followers
    startup.followers = startup.followers.filter(id => id.toString() !== req.user.id.toString());
    await startup.save();

    // Remove from Follow collection
    await Follow.deleteOne({
      followerId: req.user.id,
      followedId: startup._id,
      entityType: 'Startup'
    });

    res.status(200).json({
      success: true,
      message: 'Successfully unfollowed startup'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Save Startup
// @route   POST /api/startups/:id/save
// @access  Private
exports.saveStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const user = await User.findById(req.user.id);

    // Save startup
    if (!user.savedStartups.includes(req.params.id)) {
      user.savedStartups.push(req.params.id);
      await user.save();
    }

    // Add to startup saves
    if (!startup.saves) startup.saves = [];
    const hasSaved = startup.saves.some(save => save.userId.toString() === req.user.id.toString());
    if (!hasSaved) {
      startup.saves.push({ userId: req.user.id });
      await startup.save();
    }

    // Create SavedItem record
    try {
      await SavedItem.create({
        userId: req.user.id,
        startupId: startup._id
      });
    } catch (err) {
      // Ignore duplicates
    }

    res.status(200).json({
      success: true,
      message: 'Startup saved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Unsave Startup
// @route   DELETE /api/startups/:id/save
// @access  Private
exports.unsaveStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const user = await User.findById(req.user.id);

    // Remove from user's saved list
    user.savedStartups = user.savedStartups.filter(id => id.toString() !== req.params.id);
    await user.save();

    // Remove from startup saves list
    if (startup.saves) {
      startup.saves = startup.saves.filter(save => save.userId.toString() !== req.user.id.toString());
      await startup.save();
    }

    // Remove SavedItem record
    await SavedItem.deleteOne({
      userId: req.user.id,
      startupId: startup._id
    });

    res.status(200).json({
      success: true,
      message: 'Startup unsaved successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Startup Jobs
// @route   GET /api/startups/:id/jobs
// @access  Public
exports.getStartupJobs = async (req, res) => {
  try {
    let startupId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(startupId)) {
      const startup = await Startup.findOne({ slug: startupId });
      if (!startup) {
        return res.status(404).json({ success: false, error: 'Startup not found' });
      }
      startupId = startup._id;
    }

    const JobOpening = require('../models/JobOpening');
    const jobs = await JobOpening.find({ startupId, status: 'open' }).sort('-createdAt');
    res.status(200).json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create Job Opening for a Startup
// @route   POST /api/startups/:id/jobs
// @access  Private (Founder only)
exports.createStartupJob = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Auth check: Make sure user owns the startup
    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized to post jobs for this startup' });
    }

    const JobOpening = require('../models/JobOpening');
    const {
      title,
      description,
      roleType,
      requiredSkills,
      experienceLevel,
      workMode,
      location,
      salaryMin,
      salaryMax,
      duration,
      openings,
      deadline
    } = req.body;

    const job = await JobOpening.create({
      startupId: startup._id,
      founderId: req.user.id,
      title,
      description,
      roleType,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map(s => s.trim()) : []),
      experienceLevel,
      workMode,
      location: location || 'Remote',
      salaryMin,
      salaryMax,
      duration,
      openings: openings || 1,
      deadline: deadline ? new Date(deadline) : null,
      status: 'open'
    });

    // Also push to startup.jobs for backward compatibility if needed
    if (!startup.jobs) startup.jobs = [];
    startup.jobs.push({
      _id: job._id,
      title,
      type: roleType === 'Internship' ? 'Internship' : 'Full-time',
      location: location || 'Remote',
      salary: salaryMin ? `${salaryMin}-${salaryMax || ''}` : '',
      description,
      skills: Array.isArray(requiredSkills) ? requiredSkills : (requiredSkills ? requiredSkills.split(',').map(s => s.trim()) : [])
    });
    await startup.save();

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Send startup role request
// @route   POST /api/startups/:id/role-request
// @access  Private
exports.createStartupRoleRequest = async (req, res) => {
  try {
    const { requestType, roleTitle, skills, resume, portfolioLink, github, linkedin, message, availabilityDate, expectedSalary, reasonToJoin } = req.body;
    
    // Check if user is user / job_seeker
    if (req.user.role !== 'user' && req.user.role !== 'job_seeker') {
      return res.status(403).json({ success: false, error: 'Only users can send startup role requests' });
    }

    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    // Check if already applied to this startup with same role title and request type (pending or reviewed or connected)
    const existing = await StartupRoleRequest.findOne({
      startupId: startup._id,
      applicantId: req.user.id,
      requestType,
      roleTitle,
      status: { $in: ['pending', 'reviewed', 'connected', 'accepted', 'hired'] }
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'You have already applied for this role at this startup' });
    }

    const request = await StartupRoleRequest.create({
      startupId: startup._id,
      founderId: startup.founderId,
      applicantId: req.user.id,
      requestType,
      roleTitle,
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      resume,
      portfolioLink,
      github,
      linkedin,
      message,
      availabilityDate: availabilityDate ? new Date(availabilityDate) : null,
      expectedSalary,
      reasonToJoin,
      status: 'pending'
    });

    // Notify founder
    await createNotification({
      recipient: startup.founderId,
      sender: req.user.id,
      type: 'role_request',
      entityId: request._id,
      entityType: 'StartupRoleRequest',
      content: `${req.user.fullName || req.user.name} sent a startup role request (${requestType}: ${roleTitle}) to join ${startup.name}`
    }, req.app.get('io'));

    // Create Mail item
    try {
      const senderUser = await User.findById(req.user.id);
      const receiverUser = await User.findById(startup.founderId);
      const mailSubject = `Startup Role Request: ${roleTitle} (${requestType}) at ${startup.name}`;
      const mailBody = message || `Hi, I am interested in joining ${startup.name} as a ${roleTitle} (${requestType}). Please review my profile and skills.\n\nSkills: ${Array.isArray(skills) ? skills.join(', ') : (skills || 'N/A')}`;

      await Mail.create({
        senderId: req.user.id,
        receiverId: startup.founderId,
        senderProfileName: senderUser?.fullName || senderUser?.name || '',
        receiverProfileName: receiverUser?.fullName || receiverUser?.name || '',
        senderRole: senderUser?.role || '',
        receiverRole: receiverUser?.role || '',
        subject: mailSubject,
        body: mailBody,
        type: 'cofounder_request',
        status: 'pending',
        actionStatus: 'pending',
        relatedStartupId: startup._id,
        relatedApplicationId: request._id,
        isRead: false
      });
    } catch (mailErr) {
      console.error('Failed to create Mail item for startup role request:', mailErr);
    }

    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};

