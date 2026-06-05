const User = require('../models/User');
const Startup = require('../models/Startup');
const InvestorProfile = require('../models/InvestorProfile');
const JobApplication = require('../models/JobApplication');
const StartupRoleRequest = require('../models/StartupRoleRequest');
const Post = require('../models/Post');
const Report = require('../models/Report');
const VerificationRequest = require('../models/VerificationRequest');
const Video = require('../models/Video');

// In-memory system settings storage for hackathon simplicity
let systemSettings = {
  platformName: 'FounderX',
  allowSignups: true,
  maintenanceMode: false,
  enableAIAssistant: true,
  moderationLevel: 'medium',
  supportEmail: 'admin@founderx.com'
};

// 1. Dashboard Stats
exports.getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const founders = await User.countDocuments({ role: 'founder' });
    const investors = await User.countDocuments({ role: 'investor' });
    const jobSeekers = await User.countDocuments({ role: { $in: ['user', 'job_seeker'] } });
    const startups = await Startup.countDocuments();
    const posts = await Post.countDocuments({ contentType: { $ne: 'video' } });
    const reels = await Post.countDocuments({ contentType: 'video' });
    
    const jobAppsCount = await JobApplication.countDocuments();
    const roleReqsCount = await StartupRoleRequest.countDocuments();
    const totalApplications = jobAppsCount + roleReqsCount;
    
    const reports = await Report.countDocuments();
    const pendingVerifications = await VerificationRequest.countDocuments({ status: 'pending' });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        founders,
        investors,
        jobSeekers,
        startups,
        posts,
        reels,
        totalApplications,
        reports,
        pendingVerifications
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// 2. User Management
exports.getUsers = async (req, res) => {
  try {
    const { search, role, isVerified, isActive, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (isVerified) {
      query.isVerified = isVerified === 'true';
    }

    if (isActive) {
      query.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-passwordHash')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot block administrative accounts' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const { isVerified, badge } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    user.isVerified = isVerified;
    user.verificationStatus = isVerified ? 'verified' : 'unverified';
    if (badge) {
      user.verificationBadge = badge; // 'founder', 'investor', 'none'
    } else {
      user.verificationBadge = isVerified ? (user.role === 'investor' ? 'investor' : 'founder') : 'none';
    }
    
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot delete administrative accounts' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// 3. Startup Management
exports.getStartups = async (req, res) => {
  try {
    const { search, stage, industry, isVerified, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (stage) {
      query.stage = stage;
    }
    if (industry) {
      query.industry = industry;
    }
    if (isVerified) {
      query.isVerified = isVerified === 'true';
    }

    const skip = (page - 1) * limit;
    const total = await Startup.countDocuments(query);
    const startups = await Startup.find(query)
      .populate('founderId', 'name email')
      .skip(skip)
      .limit(parseInt(limit))
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limit),
      data: startups
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.verifyStartup = async (req, res) => {
  try {
    const { isVerified, status } = req.body;
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    startup.isVerified = isVerified;
    startup.verified = isVerified;
    startup.verificationStatus = status || (isVerified ? 'verified' : 'unverified');
    
    await startup.save();
    res.status(200).json({ success: true, data: startup });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.editStartup = async (req, res) => {
  try {
    const { name, oneLinePitch, industry, stage, contactEmail, description } = req.body;
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (name) startup.name = name;
    if (oneLinePitch) startup.oneLinePitch = oneLinePitch;
    if (industry) startup.industry = industry;
    if (stage) startup.stage = stage;
    if (contactEmail) startup.contactEmail = contactEmail;
    if (description) startup.description = description;

    await startup.save();
    res.status(200).json({ success: true, data: startup });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deleteStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    await Startup.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Startup deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// 4. Investor Management
exports.getInvestors = async (req, res) => {
  try {
    const investors = await User.find({ role: 'investor' })
      .select('-passwordHash')
      .populate('investorProfile')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: investors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.verifyInvestor = async (req, res) => {
  try {
    const { isVerified } = req.body;
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'investor') {
      return res.status(404).json({ success: false, error: 'Investor not found' });
    }

    user.isVerified = isVerified;
    user.verificationStatus = isVerified ? 'verified' : 'rejected';
    user.verificationBadge = isVerified ? 'investor' : 'none';
    
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// 5. Applications Sourcing Management
exports.getApplications = async (req, res) => {
  try {
    const jobApps = await JobApplication.find()
      .populate('jobId', 'title')
      .populate('startupId', 'name')
      .populate('founderId', 'name email')
      .populate('applicantId', 'name email username role profileImage')
      .sort('-createdAt')
      .lean();

    const roleReqs = await StartupRoleRequest.find()
      .populate('startupId', 'name')
      .populate('founderId', 'name email')
      .populate('applicantId', 'name email username role profileImage')
      .sort('-createdAt')
      .lean();

    // Standardize structure for unified view
    const formattedJobApps = jobApps.map(app => ({
      _id: app._id,
      type: 'Job opening',
      roleTitle: app.jobId?.title || 'Unknown Role',
      startupName: app.startupId?.name || 'Unknown Startup',
      founderName: app.founderId?.name || 'N/A',
      applicantName: app.applicantId?.name || 'Anonymous',
      applicantEmail: app.applicantId?.email || 'N/A',
      applicantRole: app.applicantId?.role || 'user',
      status: app.status,
      resume: app.resume,
      createdAt: app.createdAt
    }));

    const formattedRoleReqs = roleReqs.map(app => ({
      _id: app._id,
      type: `Custom Request (${app.requestType})`,
      roleTitle: app.roleTitle || 'Custom Candidate',
      startupName: app.startupId?.name || 'Unknown Startup',
      founderName: app.founderId?.name || 'N/A',
      applicantName: app.applicantId?.name || 'Anonymous',
      applicantEmail: app.applicantId?.email || 'N/A',
      applicantRole: app.applicantId?.role || 'user',
      status: app.status,
      resume: app.resume,
      createdAt: app.createdAt
    }));

    const allApplications = [...formattedJobApps, ...formattedRoleReqs].sort((a, b) => b.createdAt - a.createdAt);

    res.status(200).json({ success: true, data: allApplications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, type } = req.body; // type is 'Job opening' or custom request
    const id = req.params.id;

    if (type === 'Job opening') {
      const app = await JobApplication.findById(id);
      if (!app) {
        return res.status(404).json({ success: false, error: 'Job Application not found' });
      }
      app.status = status;
      await app.save();
      return res.status(200).json({ success: true, data: app });
    } else {
      const app = await StartupRoleRequest.findById(id);
      if (!app) {
        return res.status(404).json({ success: false, error: 'Role Request not found' });
      }
      app.status = status;
      await app.save();
      return res.status(200).json({ success: true, data: app });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// 6. Posts Tab (Community Newsfeed + Reels)
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('authorId', 'name email username profileImage')
      .populate('startupId', 'name')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post or video not found' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Content deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// 7. Incident Reports Handling
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporterId', 'name email')
      .sort('-createdAt');

    res.status(200).json({ success: true, data: reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'Reviewed', 'Resolved', 'Dismissed'
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    report.status = status;
    await report.save();

    res.status(200).json({ success: true, data: report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// 8. Analytics Aggregation
exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const founders = await User.countDocuments({ role: 'founder' });
    const investors = await User.countDocuments({ role: 'investor' });
    const jobSeekers = await User.countDocuments({ role: { $in: ['user', 'job_seeker'] } });
    const admins = await User.countDocuments({ role: 'admin' });

    const totalStartups = await Startup.countDocuments();
    const totalPosts = await Post.countDocuments({ contentType: { $ne: 'video' } });
    const totalReels = await Post.countDocuments({ contentType: 'video' });
    const totalApplications = await JobApplication.countDocuments() + await StartupRoleRequest.countDocuments();

    // Compile growth trends over last 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const userGrowth = [];
    const startupGrowth = [];
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    let currentUsersCount = await User.countDocuments({ createdAt: { $lt: sixMonthsAgo } });
    let currentStartupsCount = await Startup.countDocuments({ createdAt: { $lt: sixMonthsAgo } });

    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const label = `${months[d.getMonth()]} ${year}`;

      const startOfMonth = new Date(year, d.getMonth(), 1);
      const endOfMonth = new Date(year, d.getMonth() + 1, 0, 23, 59, 59, 999);

      const newUsers = await User.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });
      const newStartups = await Startup.countDocuments({ createdAt: { $gte: startOfMonth, $lte: endOfMonth } });

      currentUsersCount += newUsers;
      currentStartupsCount += newStartups;

      userGrowth.push({ label, registrations: newUsers, total: currentUsersCount });
      startupGrowth.push({ label, newCount: newStartups, total: currentStartupsCount });
    }

    res.status(200).json({
      success: true,
      data: {
        roleDistribution: { founder: founders, investor: investors, jobSeeker: jobSeekers, admin: admins },
        summary: { totalUsers, totalStartups, totalPosts, totalReels, totalApplications },
        userGrowth,
        startupGrowth
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// 9. Config Settings Management
exports.getSettings = async (req, res) => {
  try {
    res.status(200).json({ success: true, data: systemSettings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { platformName, allowSignups, maintenanceMode, enableAIAssistant, moderationLevel, supportEmail } = req.body;
    
    if (platformName !== undefined) systemSettings.platformName = platformName;
    if (allowSignups !== undefined) systemSettings.allowSignups = allowSignups;
    if (maintenanceMode !== undefined) systemSettings.maintenanceMode = maintenanceMode;
    if (enableAIAssistant !== undefined) systemSettings.enableAIAssistant = enableAIAssistant;
    if (moderationLevel !== undefined) systemSettings.moderationLevel = moderationLevel;
    if (supportEmail !== undefined) systemSettings.supportEmail = supportEmail;

    res.status(200).json({ success: true, data: systemSettings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
