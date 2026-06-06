const {
  getAll,
  getById,
  create,
  updateById,
  deleteById,
  findOneByField,
  filter
} = require('../utils/firebaseHelpers');

let systemSettings = {
  platformName: 'FounderX',
  allowSignups: true,
  maintenanceMode: false,
  enableAIAssistant: true,
  moderationLevel: 'medium',
  supportEmail: 'admin@founderx.com'
};

const countByRole = async (role) => {
  const users = await getAll('users');
  if (!role) return users.length;
  if (role === 'job_seeker') {
    return users.filter((u) => u.role === 'user' || u.role === 'job_seeker').length;
  }
  return users.filter((u) => u.role === role).length;
};

const parseIntOrDefault = (val, defaultVal = 20) => {
  const parsed = parseInt(val);
  return isNaN(parsed) ? defaultVal : parsed;
};

exports.getAdminStats = async (req, res) => {
  try {
    const users = await getAll('users');
    const startups = await getAll('startups');
    const posts = await getAll('posts');
    const applications = await getAll('applications');
    const reports = await getAll('reports');
    const verificationRequests = await getAll('verificationRequests');

    const totalUsers = users.length;
    const founders = users.filter((u) => u.role === 'founder').length;
    const investors = users.filter((u) => u.role === 'investor').length;
    const jobSeekers = users.filter((u) => u.role === 'user' || u.role === 'job_seeker').length;

    const postsCount = posts.filter((p) => p.contentType !== 'video').length;
    const reelsCount = posts.filter((p) => p.contentType === 'video').length;

    const pendingVerifications = verificationRequests.filter((v) => v.status === 'pending').length;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        founders,
        investors,
        jobSeekers,
        startups: startups.length,
        posts: postsCount,
        reels: reelsCount,
        totalApplications: applications.length,
        reports: reports.length,
        pendingVerifications
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { search, role, isVerified, isActive, page = 1, limit = 20 } = req.query;
    const pageNum = parseIntOrDefault(page, 1);
    const limitNum = parseIntOrDefault(limit, 20);

    let users = await getAll('users');

    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter((u) => {
        const fullName = (u.fullName || '').toLowerCase();
        const username = (u.username || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return fullName.includes(searchLower) || username.includes(searchLower) || email.includes(searchLower);
      });
    }

    if (role) {
      users = users.filter((u) => u.role === role);
    }

    if (isVerified) {
      const verified = isVerified === 'true';
      users = users.filter((u) => u.isVerified === verified);
    }

    if (isActive) {
      const active = isActive === 'true';
      users = users.filter((u) => u.isActive === active);
    }

    const total = users.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedUsers = users.slice(skip, skip + limitNum).map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    res.status(200).json({
      success: true,
      count: paginatedUsers.length,
      total,
      pages: Math.ceil(total / limitNum),
      data: paginatedUsers
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.toggleUserBlock = async (req, res) => {
  try {
    const user = await getById('users', req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot block administrative accounts' });
    }

    const newState = !user.isActive;
    const updated = await updateById('users', req.params.id, { isActive: newState });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Toggle user block error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.verifyUser = async (req, res) => {
  try {
    const { isVerified, badge } = req.body;
    const user = await getById('users', req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const verificationBadge = badge
      ? badge
      : isVerified
      ? user.role === 'investor'
        ? 'investor'
        : 'founder'
      : 'none';

    const updated = await updateById('users', req.params.id, {
      isVerified,
      verificationStatus: isVerified ? 'verified' : 'unverified',
      verificationBadge
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await getById('users', req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, error: 'Cannot delete administrative accounts' });
    }

    await deleteById('users', req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getStartups = async (req, res) => {
  try {
    const { search, stage, industry, isVerified, page = 1, limit = 20 } = req.query;
    const pageNum = parseIntOrDefault(page, 1);
    const limitNum = parseIntOrDefault(limit, 20);

    let startups = await getAll('startups');

    if (search) {
      const searchLower = search.toLowerCase();
      startups = startups.filter((s) => (s.name || '').toLowerCase().includes(searchLower));
    }

    if (stage) {
      startups = startups.filter((s) => s.stage === stage);
    }

    if (industry) {
      startups = startups.filter((s) => s.industry === industry);
    }

    if (isVerified) {
      const verified = isVerified === 'true';
      startups = startups.filter((s) => s.isVerified === verified);
    }

    const total = startups.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedStartups = startups.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limitNum),
      data: paginatedStartups
    });
  } catch (error) {
    console.error('Get startups error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.verifyStartup = async (req, res) => {
  try {
    const { isVerified, status } = req.body;
    const startup = await getById('startups', req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const updated = await updateById('startups', req.params.id, {
      isVerified,
      verified: isVerified,
      verificationStatus: status || (isVerified ? 'verified' : 'unverified')
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Verify startup error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.editStartup = async (req, res) => {
  try {
    const { name, oneLinePitch, industry, stage, contactEmail, description } = req.body;
    const startup = await getById('startups', req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (oneLinePitch !== undefined) updates.oneLinePitch = oneLinePitch;
    if (industry !== undefined) updates.industry = industry;
    if (stage !== undefined) updates.stage = stage;
    if (contactEmail !== undefined) updates.contactEmail = contactEmail;
    if (description !== undefined) updates.description = description;

    const updated = await updateById('startups', req.params.id, updates);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Edit startup error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deleteStartup = async (req, res) => {
  try {
    const startup = await getById('startups', req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    await deleteById('startups', req.params.id);
    res.status(200).json({ success: true, message: 'Startup deleted successfully' });
  } catch (error) {
    console.error('Delete startup error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = parseIntOrDefault(page, 1);
    const limitNum = parseIntOrDefault(limit, 20);

    let applications = await getAll('applications');

    if (status) {
      applications = applications.filter((app) => app.status === status);
    }

    const total = applications.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedApps = applications.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limitNum),
      data: paginatedApps
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseIntOrDefault(page, 1);
    const limitNum = parseIntOrDefault(limit, 20);

    let posts = await getAll('posts');
    posts = posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const total = posts.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedPosts = posts.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limitNum),
      data: paginatedPosts
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await getById('posts', req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, error: 'Post not found' });
    }

    await deleteById('posts', req.params.id);
    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = parseIntOrDefault(page, 1);
    const limitNum = parseIntOrDefault(limit, 20);

    let reports = await getAll('reports');

    if (status) {
      reports = reports.filter((r) => r.status === status);
    }

    reports = reports.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const total = reports.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedReports = reports.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limitNum),
      data: paginatedReports
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.resolveReport = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const report = await getById('reports', req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const updated = await updateById('reports', req.params.id, {
      status: 'resolved',
      adminAction: action,
      resolutionReason: reason,
      resolvedAt: Date.now()
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getUsersGrowthChart = async (req, res) => {
  try {
    const users = await getAll('users');
    const now = Date.now();
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;

    const filteredUsers = users.filter((u) => (u.createdAt || 0) >= sixMonthsAgo);

    const months = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    filteredUsers.forEach((u) => {
      const d = new Date(u.createdAt || now);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months.hasOwnProperty(key)) {
        months[key]++;
      }
    });

    const data = Object.entries(months).map(([month, count]) => ({ month, count }));
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Users growth chart error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getSystemSettings = (req, res) => {
  try {
    res.status(200).json({ success: true, data: systemSettings });
  } catch (error) {
    console.error('Get system settings error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateSystemSettings = (req, res) => {
  try {
    const { platformName, allowSignups, maintenanceMode, enableAIAssistant, moderationLevel, supportEmail } = req.body;
    if (platformName) systemSettings.platformName = platformName;
    if (typeof allowSignups === 'boolean') systemSettings.allowSignups = allowSignups;
    if (typeof maintenanceMode === 'boolean') systemSettings.maintenanceMode = maintenanceMode;
    if (typeof enableAIAssistant === 'boolean') systemSettings.enableAIAssistant = enableAIAssistant;
    if (moderationLevel) systemSettings.moderationLevel = moderationLevel;
    if (supportEmail) systemSettings.supportEmail = supportEmail;

    res.status(200).json({ success: true, data: systemSettings });
  } catch (error) {
    console.error('Update system settings error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getInvestors = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = parseIntOrDefault(page, 1);
    const limitNum = parseIntOrDefault(limit, 20);

    let users = (await getAll('users')).filter((u) => u.role === 'investor');
    const total = users.length;
    const skip = (pageNum - 1) * limitNum;
    const paginated = users.slice(skip, skip + limitNum).map((u) => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    res.status(200).json({ success: true, total, pages: Math.ceil(total / limitNum), data: paginated });
  } catch (error) {
    console.error('Get investors error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.verifyInvestor = exports.verifyUser;

exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await getById('applications', req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    const updated = await updateById('applications', req.params.id, { status, updatedAt: Date.now() });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateReportStatus = exports.resolveReport;
exports.getAnalytics = exports.getUsersGrowthChart;
exports.getSettings = exports.getSystemSettings;
exports.updateSettings = exports.updateSystemSettings;
