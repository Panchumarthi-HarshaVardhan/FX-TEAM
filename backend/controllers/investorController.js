const Startup = require('../models/Startup');
const InvestmentRequest = require('../models/InvestmentRequest');
const Notification = require('../models/Notification');
const InvestorProfile = require('../models/InvestorProfile');
const User = require('../models/User');
const InvestorStartupConnection = require('../models/InvestorStartupConnection');
const StartupUpdate = require('../models/StartupUpdate');
const Mail = require('../models/Mail');



// @desc    Toggle save/unsave a startup to investor's watchlist
// @route   POST /api/investor/save-startup/:id
// @access  Private
exports.toggleSaveStartup = async (req, res) => {
  try {
    const { id: startupId } = req.params;
    const investorId = req.user.id;

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const saveIndex = startup.saves.findIndex(save => 
      save.userId.toString() === investorId.toString()
    );

    let isSaved;
    if (saveIndex > -1) {
      // Unsaving
      startup.saves.splice(saveIndex, 1);
      isSaved = false;
    } else {
      // Saving
      startup.saves.push({ userId: investorId });
      isSaved = true;
    }

    await startup.save();

    res.status(200).json({
      success: true,
      data: { isSaved }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get investor's watchlist
// @route   GET /api/investor/watchlist
// @access  Private
exports.getWatchlist = async (req, res) => {
  try {
    const investorId = req.user.id;

    const savedStartups = await Startup.find({
      'saves.userId': investorId
    }).populate('founderId', 'name email profileImage');

    res.status(200).json({
      success: true,
      data: savedStartups
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Send interest request to startup founder
// @route   POST /api/investor/interest-request
// @access  Private
exports.sendInterestRequest = async (req, res) => {
  try {
    const { startupId, investorId, message, investmentRange, interestedAmount, investmentType, meetingRequest, attachmentUrl } = req.body;
    const userId = req.user.id;

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    let finalInvestorId;
    let finalFounderId;
    let recipientId;
    let notificationContent;

    if (req.user.role === 'investor') {
      // Investor expressing interest in Startup
      finalInvestorId = userId;
      finalFounderId = startup.founderId;
      recipientId = startup.founderId;
      notificationContent = `Investor ${req.user.name} expressed interest in ${startup.name}`;
    } else {
      // Founder pitching to Investor
      if (!investorId) {
        return res.status(400).json({ success: false, error: 'Investor ID is required for pitches' });
      }
      finalInvestorId = investorId;
      finalFounderId = userId;
      recipientId = investorId;
      notificationContent = `Founder ${req.user.name} pitched ${startup.name} to you`;
    }

    // Check if connection already exists
    const existingConnection = await InvestorStartupConnection.findOne({
      startupId,
      investorId: finalInvestorId,
      status: { $in: ['connected', 'invested'] }
    });
    if (existingConnection) {
      return res.status(400).json({ success: false, error: 'You are already connected with this startup.' });
    }

    // Check for duplicate pending request
    const existingRequest = await InvestmentRequest.findOne({
      startupId,
      investorId: finalInvestorId,
      founderId: finalFounderId,
      status: 'pending'
    });
    if (existingRequest) {
      return res.status(400).json({ success: false, error: 'Investment request already exists' });
    }

    // Create investment request
    const interestRequest = await InvestmentRequest.create({
      startupId,
      investorId: finalInvestorId,
      founderId: finalFounderId,
      message,
      investmentRange,
      interestedAmount: interestedAmount || investmentRange || '',
      investmentType: investmentType || 'Equity',
      meetingRequest: !!meetingRequest,
      attachmentUrl: attachmentUrl || '',
      status: 'pending'
    });

    // Increment investor interest count on startup
    startup.metrics.investorInterest += 1;
    await startup.save();

    // Create notification for recipient
    const io = req.app.get('io');
    const notification = await Notification.create({
      recipient: recipientId,
      sender: userId,
      type: 'investment_request',
      entityId: interestRequest._id,
      entityType: 'InvestmentRequest',
      content: message || notificationContent
    });

    // Emit real-time notification
    if (io) {
      io.to(recipientId.toString()).emit('new_notification', notification);
    }

    // Create Mail item
    try {
      const senderUser = await User.findById(userId);
      const receiverUser = await User.findById(recipientId);
      const mailSubject = req.user.role === 'investor' 
        ? `Investment Interest for ${startup.name}` 
        : `Pitch request: ${startup.name}`;
      
      const mailBody = `Startup: ${startup.name}\n` +
                       `Investor: ${senderUser?.fullName || senderUser?.name || 'Investor'}\n` +
                       `Interested Amount: ${interestedAmount || investmentRange || 'N/A'}\n` +
                       `Investment Type: ${investmentType || 'Equity'}\n` +
                       `Meeting Requested: ${meetingRequest ? 'Yes' : 'No'}\n` +
                       `Attachment/Link: ${attachmentUrl || 'None'}\n\n` +
                       `Message:\n${message}`;

      await Mail.create({
        senderId: userId,
        receiverId: recipientId,
        senderProfileName: senderUser?.fullName || senderUser?.name || '',
        receiverProfileName: receiverUser?.fullName || receiverUser?.name || '',
        senderRole: senderUser?.role || '',
        receiverRole: receiverUser?.role || '',
        subject: mailSubject,
        body: mailBody,
        type: 'investment_request',
        status: 'pending',
        actionStatus: 'pending',
        relatedStartupId: startupId,
        relatedInvestmentRequestId: interestRequest._id,
        isRead: false,
        attachments: attachmentUrl ? [attachmentUrl] : []
      });
    } catch (mailErr) {
      console.error('Failed to create Mail item for investment request:', mailErr);
    }

    res.status(201).json({
      success: true,
      data: interestRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get investor's sent interest requests
// @route   GET /api/investor/requests
// @access  Private
exports.getInvestorRequests = async (req, res) => {
  try {
    const investorId = req.user.id;

    const requests = await InvestmentRequest.find({ investorId })
      .populate('startupId', 'name logo')
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

// @desc    Get all open/public investors
// @route   GET /api/investor
// @access  Public
exports.getOpenInvestors = async (req, res) => {
  try {
    const openProfiles = await InvestorProfile.find({
      open_to_invest: true
    }).populate('user', 'name profileImage bio email isVerified location role');

    const investors = openProfiles
      .filter(profile => profile.user)
      .map(profile => {
        const userObj = profile.user.toObject ? profile.user.toObject() : profile.user;
        return {
          _id: userObj._id,
          name: userObj.name,
          profileImage: userObj.profileImage,
          bio: profile.bio || userObj.bio || '',
          location: profile.location || (userObj.location ? `${userObj.location.city || ''}${userObj.location.city && userObj.location.country ? ', ' : ''}${userObj.location.country || ''}` : ''),
          verified: profile.verified_investor || userObj.isVerified || false,
          roleProfile: profile.toObject(),
          role: 'investor'
        };
      });

    res.status(200).json({
      success: true,
      count: investors.length,
      data: investors
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Toggle open_to_invest status
// @route   PUT /api/investor/toggle-open
// @access  Private (Investor only)
exports.toggleOpenToInvest = async (req, res) => {
  try {
    if (req.user.role !== 'investor') {
      return res.status(403).json({ success: false, error: 'Not authorized. Only investors can modify availability.' });
    }

    const { open_to_invest } = req.body;
    if (open_to_invest === undefined || typeof open_to_invest !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Please provide open_to_invest boolean value' });
    }

    let profile = await InvestorProfile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new InvestorProfile({ user: req.user.id });
    }

    profile.open_to_invest = open_to_invest;
    await profile.save();

    res.status(200).json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// ==========================================
// INVESTOR PORTAL CONTROLLERS
// ==========================================

// @desc    Get investor portal data
// @route   GET /api/investor/portal-data
// @access  Private (Investor only)
exports.getInvestorPortalData = async (req, res) => {
  try {
    const investorId = req.user.id;

    if (req.user.role !== 'investor' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Only investors can view this portal.' });
    }

    const connections = await InvestorStartupConnection.find({ investorId })
      .populate('startupId')
      .populate('founderId', 'name fullName email profileImage bio');

    const pendingRequests = await InvestmentRequest.find({ investorId, status: 'pending' })
      .populate('startupId', 'name logo oneLinePitch industry stage');

    const totalConnections = connections.length;
    const totalInvested = connections.filter(c => c.status === 'invested').length;
    const totalPending = pendingRequests.length;
    const totalAmount = connections.reduce((sum, c) => sum + (c.investmentAmount || 0), 0);
    const totalDueDiligence = connections.filter(c => c.pipelineStage === 'Due Diligence').length;

    const connectedStartupIds = connections.map(c => c.startupId?._id).filter(Boolean);
    const updates = await StartupUpdate.find({
      startupId: { $in: connectedStartupIds },
      visibleToConnectedInvestors: true
    })
      .populate('startupId', 'name logo')
      .sort('-createdAt')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        analytics: {
          totalConnectedStartups: totalConnections,
          totalInvestedStartups: totalInvested,
          pendingRequests: totalPending,
          totalInvestmentAmount: totalAmount,
          startupsInDueDiligence: totalDueDiligence,
          recentUpdatesCount: updates.length
        },
        connections,
        pendingRequests,
        updates
      }
    });
  } catch (error) {
    console.error('Error fetching investor portal data:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update connection pipeline stage
// @route   PATCH /api/investor/pipeline/:id/stage
// @access  Private (Investor only)
exports.updatePipelineStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const connection = await InvestorStartupConnection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    if (connection.investorId.toString() !== req.user.id && connection.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this pipeline' });
    }

    connection.pipelineStage = stage;
    if (stage === 'Invested') {
      connection.status = 'invested';
      if (!connection.investedAt) {
        connection.investedAt = new Date();
      }
    } else if (stage === 'Rejected') {
      connection.status = 'rejected';
    } else {
      connection.status = 'connected';
    }

    await connection.save();

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update private notes
// @route   PATCH /api/investor/pipeline/:id/notes
// @access  Private (Investor only)
exports.updatePrivateNotes = async (req, res) => {
  try {
    const { notes } = req.body;
    const connection = await InvestorStartupConnection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    if (connection.investorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to modify private notes' });
    }

    connection.privateNotes = notes || '';
    await connection.save();

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Mark startup as invested
// @route   PATCH /api/investor/pipeline/:id/invested
// @access  Private (Investor only)
exports.markStartupAsInvested = async (req, res) => {
  try {
    const { investmentAmount, equityPercentage } = req.body;
    const connection = await InvestorStartupConnection.findById(req.params.id);

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    if (connection.investorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    connection.status = 'invested';
    connection.pipelineStage = 'Invested';
    connection.investmentAmount = Number(investmentAmount) || 0;
    connection.equityPercentage = Number(equityPercentage) || 0;
    connection.investedAt = new Date();
    await connection.save();

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get updates from connected startups
// @route   GET /api/investor/updates
// @access  Private (Investor only)
exports.getConnectedStartupUpdates = async (req, res) => {
  try {
    const investorId = req.user.id;

    const connections = await InvestorStartupConnection.find({ investorId });
    const startupIds = connections.map(c => c.startupId);

    const updates = await StartupUpdate.find({
      startupId: { $in: startupIds },
      visibleToConnectedInvestors: true
    })
      .populate('startupId', 'name logo')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: updates
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get details of a single connection (Investment Room data)
// @route   GET /api/investor/connection/:id
// @access  Private (Founder or Connected Investor)
exports.getConnectionDetail = async (req, res) => {
  try {
    const connectionId = req.params.id;
    const userId = req.user.id;

    const connection = await InvestorStartupConnection.findById(connectionId)
      .populate('startupId', 'name logo oneLinePitch description industry stage fundingNeeded fundingRequired minInvestment equityOffered pitchDeck teamMembers')
      .populate('investorId', 'name fullName email profileImage role headline')
      .populate('founderId', 'name fullName email profileImage role headline');

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // Security check: Only the founder or investor involved can access
    if (connection.investorId._id.toString() !== userId && connection.founderId._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied to this investment room' });
    }

    // Fetch startup updates
    const updates = await StartupUpdate.find({ startupId: connection.startupId._id })
      .populate('founderId', 'name fullName profileImage')
      .sort('-createdAt');

    // Filter privateNotes: only visible to investor. If requester is founder, hide it!
    const resultConnection = connection.toObject();
    if (connection.founderId._id.toString() === userId) {
      delete resultConnection.privateNotes;
    }

    res.status(200).json({
      success: true,
      data: {
        connection: resultConnection,
        updates
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Add shared link to connection
// @route   POST /api/investor/connection/:id/link
// @access  Private (Founder or Connected Investor)
exports.addSharedLink = async (req, res) => {
  try {
    const connectionId = req.params.id;
    const { title, url } = req.body;
    const userId = req.user.id;

    if (!title || !url) {
      return res.status(400).json({ success: false, error: 'Title and URL are required' });
    }

    const connection = await InvestorStartupConnection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // Security check
    if (connection.investorId.toString() !== userId && connection.founderId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    connection.sharedLinks.push({
      title,
      url,
      addedBy: userId
    });

    await connection.save();

    res.status(200).json({ success: true, data: connection.sharedLinks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update meeting notes
// @route   PATCH /api/investor/connection/:id/meeting-notes
// @access  Private (Founder or Connected Investor)
exports.updateMeetingNotes = async (req, res) => {
  try {
    const connectionId = req.params.id;
    const { meetingNotes } = req.body;
    const userId = req.user.id;

    const connection = await InvestorStartupConnection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    // Security check
    if (connection.investorId.toString() !== userId && connection.founderId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    connection.meetingNotes = meetingNotes || '';
    await connection.save();

    res.status(200).json({ success: true, data: connection.meetingNotes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
