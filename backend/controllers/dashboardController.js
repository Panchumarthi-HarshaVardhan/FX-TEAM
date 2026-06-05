const Startup = require('../models/Startup');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Post = require('../models/Post');
const User = require('../models/User');
const Report = require('../models/Report');

// @desc    Get Founder Dashboard Data
// @route   GET /api/dashboard/founder
// @access  Private (Founder only)
exports.getFounderDashboard = async (req, res) => {
  try {
    const founderId = req.user.id;

    const startups = await Startup.find({ founderId });
    const products = await Product.find({ founderId });
    const orders = await Order.find({ founderId })
      .populate('userId', 'name email')
      .populate('productId', 'name price')
      .sort('-createdAt');

    const analytics = {
      totalStartups: startups.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      revenue: orders.reduce((acc, order) => acc + order.totalAmount, 0)
    };

    res.status(200).json({
      success: true,
      data: {
        startups,
        products,
        orders,
        analytics
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Investor Dashboard Data
// @route   GET /api/dashboard/investor
// @access  Private (Investor only)
exports.getInvestorDashboard = async (req, res) => {
  try {
    // For now, we'll return all startups as "browsing" logic
    // In a real app, we'd have a "SavedStartup" model or field
    
    // Simulating "Saved" startups (fetching random 5 for demo)
    const savedStartups = await Startup.find().limit(5).populate('founderId', 'name');
    
    // Get recent pitches (videos)
    const interestedPitches = await Post.find({ type: 'video' })
      .sort('-createdAt')
      .limit(10)
      .populate('authorId', 'name')
      .populate('startupId', 'name');

    res.status(200).json({
      success: true,
      data: {
        savedStartups,
        interestedPitches
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get User Dashboard Data
// @route   GET /api/dashboard/user
// @access  Private (User only)
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const InvestmentRequest = require('../models/InvestmentRequest');

    const user = await User.findById(userId).populate('following');

    // 1. Analytics
    const postsCreatedCount = await Post.countDocuments({ authorId: userId });
    
    // startupsFollowed: count startups that have the user as a follower
    const startupsFollowedCount = await Startup.countDocuments({ followers: userId });

    const productsSavedCount = user.savedPosts ? user.savedPosts.length : 0;
    
    // investorConnections: Accepted investment requests where this user is founder or investor
    const investorConnectionsCount = await InvestmentRequest.countDocuments({
      status: 'accepted',
      $or: [{ founderId: userId }, { investorId: userId }]
    });

    const analytics = {
      postsCreated: postsCreatedCount,
      startupsFollowed: startupsFollowedCount,
      productsSaved: productsSavedCount,
      investorConnections: investorConnectionsCount,
      founderScore: user.founderScore || 50,
      profileViews: user.profileViews ? user.profileViews.length : 0
    };

    // 2. Activity Feed (Recent posts from people they follow or general public posts)
    const rawFeed = await Post.find({
      $or: [
        { authorId: { $in: [...(user.following || []).map(f => f._id), userId] } },
        { accessLevel: 'public' }
      ]
    })
    .sort('-createdAt')
    .limit(10)
    .populate('authorId', 'name username profileImage')
    .populate('startupId', 'name logo oneLinePitch')
    .lean();

    const activityFeed = rawFeed.map(post => {
      return {
        _id: post._id,
        type: post.contentType === 'video' ? 'video' : 'post',
        author: post.authorId?.name || 'Anonymous',
        startup: post.startupId?.name || '',
        content: post.content,
        time: 'Just now', // For demo simplicity or post.createdAt format
        likes: post.likes ? post.likes.length : 0,
        comments: post.comments ? post.comments.length : 0
      };
    });

    // 3. Trending Startups
    const trendingStartupsRaw = await Startup.find()
      .limit(4)
      .populate('founderId', 'name')
      .lean();

    const trendingStartups = trendingStartupsRaw.map(s => ({
      _id: s._id,
      name: s.name,
      tagline: s.oneLinePitch,
      industry: s.industry,
      stage: s.stage,
      aiScore: s.aiScore || (70 + (s.followers ? s.followers.length : 0))
    }));

    // 4. Founder Suggestions
    const suggestedFoundersRaw = await User.find({
      role: 'founder',
      _id: { $ne: userId }
    })
    .limit(5)
    .select('name role profileImage industry founderScore')
    .lean();

    const founderSuggestions = suggestedFoundersRaw.map(f => ({
      _id: f._id,
      name: f.name,
      role: f.role || 'Founder',
      industry: f.industry || 'Technology',
      score: f.founderScore || 65,
      avatar: f.profileImage || null
    }));

    // 5. AI Recommendations
    const aiRecommendations = trendingStartups.slice(0, 3).map(s => ({
      type: 'startup',
      name: s.name,
      tagline: s.tagline,
      industry: s.industry,
      match: s.aiScore
    }));

    // 6. Notifications
    const notificationsRaw = await Notification.find({ recipient: userId })
      .sort('-createdAt')
      .limit(5)
      .populate('sender', 'name')
      .lean();

    const notifications = notificationsRaw.map(n => ({
      _id: n._id,
      text: n.content || `${n.sender?.name || 'Someone'} triggered ${n.type}`,
      time: '1h ago',
      type: n.type
    }));

    // 7. Orders
    const myOrders = await Order.find({ userId })
      .populate('productId', 'name price images')
      .populate('founderId', 'name')
      .sort('-createdAt')
      .limit(5);

    // 8. Badges
    const badges = [
      { name: 'Startup Creator', earned: startupsFollowedCount > 0 },
      { name: 'Early Builder', earned: postsCreatedCount > 0 },
      { name: 'Investor Connected', earned: investorConnectionsCount > 0 },
      { name: 'Product Launcher', earned: user.isProfileComplete }
    ];

    res.status(200).json({
      success: true,
      data: {
        analytics,
        aiRecommendations,
        activityFeed,
        founderSuggestions,
        trendingStartups,
        notifications,
        badges,
        myOrders
      }
    });
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get Admin Dashboard Data
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
exports.getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const deactivatedUsers = await User.countDocuments({ isActive: false });
    const pendingReports = await Report.countDocuments({ status: 'Pending' });
    const totalPosts = await Post.countDocuments({ contentType: { $ne: 'video' } });
    const totalReels = await Post.countDocuments({ contentType: 'video' });
    const verifiedBadgesApproved = await User.countDocuments({ isVerified: true });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const userGrowthRaw = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const userGrowth = [];
    let currentTotal = await User.countDocuments({ createdAt: { $lt: sixMonthsAgo } });

    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const label = `${months[d.getMonth()]} ${year}`;

      const matched = userGrowthRaw.find(item => item._id.year === year && item._id.month === monthNum);
      const newRegistrations = matched ? matched.count : 0;
      currentTotal += newRegistrations;

      userGrowth.push({
        label,
        registrations: newRegistrations,
        total: currentTotal
      });
    }

    const roleCounts = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    const founderCount = roleCounts.find(r => r._id === 'founder')?.count || 0;
    const investorCount = roleCounts.find(r => r._id === 'investor')?.count || 0;
    const userCount = roleCounts.find(r => r._id === 'user')?.count || 0;
    const oldJobSeekerCount = roleCounts.find(r => r._id === 'job_seeker')?.count || 0;
    const jobSeekerCount = userCount + oldJobSeekerCount;
    const adminCount = roleCounts.find(r => r._id === 'admin')?.count || 0;

    const roleDistribution = {
      founder: founderCount,
      investor: investorCount,
      jobSeeker: jobSeekerCount,
      user: userCount,
      admin: adminCount
    };

    const reportCounts = await Report.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    const reportsByStatus = {
      pending: reportCounts.find(r => r._id === 'Pending' || r._id === 'pending')?.count || 0,
      reviewed: reportCounts.find(r => r._id === 'Reviewed' || r._id === 'reviewed')?.count || 0,
      resolved: reportCounts.find(r => r._id === 'Resolved' || r._id === 'resolved')?.count || 0,
      dismissed: reportCounts.find(r => r._id === 'Dismissed' || r._id === 'dismissed')?.count || 0
    };

    const postsActivityRaw = await Post.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            isReel: { $eq: ['$contentType', 'video'] }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const activityData = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const year = d.getFullYear();
      const monthNum = d.getMonth() + 1;
      const label = `${months[d.getMonth()]} ${year}`;

      const matchPost = postsActivityRaw.find(item => item._id.year === year && item._id.month === monthNum && item._id.isReel === false);
      const matchReel = postsActivityRaw.find(item => item._id.year === year && item._id.month === monthNum && item._id.isReel === true);

      activityData.push({
        label,
        posts: matchPost ? matchPost.count : 0,
        reels: matchReel ? matchReel.count : 0
      });
    }

    const totalVerified = verifiedBadgesApproved;
    const totalUnverified = Math.max(0, totalUsers - totalVerified);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          deactivatedUsers,
          pendingReports,
          totalPosts,
          totalReels,
          verifiedBadgesApproved
        },
        userGrowth,
        roleDistribution,
        reportsByStatus,
        activityData,
        verificationStats: {
          verified: totalVerified,
          unverified: totalUnverified
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
