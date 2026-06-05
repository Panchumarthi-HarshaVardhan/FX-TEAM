const express = require('express');
const router = express.Router();
const Startup = require('../models/Startup');
const JobApplication = require('../models/JobApplication');
const StartupTeamMember = require('../models/StartupTeamMember');
const Conversation = require('../models/Conversation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const StartupRoleRequest = require('../models/StartupRoleRequest');
const InvestmentRequest = require('../models/InvestmentRequest');
const InvestorStartupConnection = require('../models/InvestorStartupConnection');
const StartupUpdate = require('../models/StartupUpdate');
const { protect } = require('../middleware/auth');
const { createNotification } = require('../utils/socialHelpers');
const Mail = require('../models/Mail');


// Helper to create notifications robustly
const sendNotify = async (req, recipientId, type, entityId, entityType, messageText) => {
  try {
    await Notification.create({
      recipient: recipientId,
      recipientId: recipientId,
      sender: req.user.id,
      senderId: req.user.id,
      type,
      entityId,
      entityType,
      message: messageText,
      content: messageText,
      isRead: false
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// @desc    Get received job applications for all startups owned by this founder
// @route   GET /api/founder/applications
// @access  Private
router.get('/applications', protect, async (req, res) => {
  try {
    // Find all startups owned by this founder
    const startups = await Startup.find({ founderId: req.user.id });
    const startupIds = startups.map(s => s._id);

    const filter = { startupId: { $in: startupIds } };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const applications = await JobApplication.find(filter)
      .populate('applicantId', 'name fullName email profileImage headline skills socialLinks')
      .populate('jobId')
      .populate('startupId', 'name logo industry')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Get single job application and update status to reviewed if pending
// @route   GET /api/founder/applications/:applicationId
// @access  Private
router.get('/applications/:applicationId', protect, async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.applicationId)
      .populate('applicantId', 'name fullName email profileImage headline skills socialLinks bio location')
      .populate('jobId')
      .populate('startupId', 'name logo industry founderId');

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    // Auth check: Make sure founder owns the startup
    if (application.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // Update status to reviewed if it was pending
    if (application.status === 'pending') {
      application.status = 'reviewed';
      application.reviewedAt = new Date();
      await application.save();
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Update application status directly (Accept, Reject, Shortlist)
// @route   PATCH /api/founder/applications/:applicationId/status
// @access  Private
router.patch('/applications/:applicationId/status', protect, async (req, res) => {
  try {
    const { status } = req.body; // shortlisted, accepted, rejected, etc.
    const application = await JobApplication.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    application.status = status;
    if (status === 'accepted') {
      application.acceptedAt = new Date();
      
      // Auto-unlock messaging upon acceptance if not already unlocked
      let conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, application.applicantId] },
        type: 'direct'
      });
      if (!conversation) {
        await Conversation.create({
          participants: [req.user.id, application.applicantId],
          initiator: req.user.id,
          type: 'direct',
          applicationId: application._id,
          startupId: application.startupId,
          status: 'accepted'
        });
      } else if (conversation.status !== 'accepted') {
        conversation.status = 'accepted';
        await conversation.save();
      }

      await sendNotify(req, application.applicantId, 'invite_accepted', application._id, 'JobApplication', `Your application to ${application.startupId.name || 'Startup'} has been accepted!`);
    } else if (status === 'rejected') {
      application.rejectedAt = new Date();
      await sendNotify(req, application.applicantId, 'invite_rejected', application._id, 'JobApplication', `Your application for the role has been rejected.`);
    }

    await application.save();

    // Synchronize Mail item status
    try {
      const mailStatus = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : status === 'shortlisted' ? 'interview' : 'none';
      await Mail.findOneAndUpdate(
        { relatedApplicationId: application._id },
        { actionStatus: mailStatus, status }
      );
    } catch (mailErr) {
      console.error('Failed to sync Mail status on application status update:', mailErr);
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Connect with applicant (unlocks messaging, status = connected)
// @route   POST /api/founder/applications/:applicationId/connect
// @access  Private
router.post('/applications/:applicationId/connect', protect, async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    application.status = 'connected';
    application.connectedAt = new Date();
    await application.save();

    // Unlock direct messaging by creating / updating Conversation status to 'accepted'
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, application.applicantId] },
      type: 'direct'
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, application.applicantId],
        initiator: req.user.id,
        type: 'direct',
        applicationId: application._id,
        startupId: application.startupId,
        status: 'accepted'
      });
    } else {
      conversation.status = 'accepted';
      await conversation.save();
    }

    // Send notification
    const startup = await Startup.findById(application.startupId);
    await sendNotify(req, application.applicantId, 'invite_accepted', application._id, 'JobApplication', `${req.user.fullName || req.user.name} wants to connect with you for the role at ${startup ? startup.name : 'Startup'}.`);

    // Synchronize Mail item status
    try {
      await Mail.findOneAndUpdate(
        { relatedApplicationId: application._id },
        { actionStatus: 'connected', status: 'connected' }
      );
    } catch (mailErr) {
      console.error('Failed to sync Mail status on application connect:', mailErr);
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Hire applicant and add to startup team
// @route   POST /api/founder/applications/:applicationId/hire
// @access  Private
router.post('/applications/:applicationId/hire', protect, async (req, res) => {
  try {
    const { teamRole, startDate, workMode, notes } = req.body;
    const application = await JobApplication.findById(req.params.applicationId);

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    if (application.status === 'hired') {
      return res.status(400).json({ success: false, error: 'Applicant has already been hired' });
    }

    const applicantUser = await User.findById(application.applicantId);
    
    // Check if they are already in the StartupTeamMember model
    const existingTeamMember = await StartupTeamMember.findOne({
      startupId: application.startupId,
      userId: application.applicantId
    });
    if (existingTeamMember) {
      return res.status(400).json({ success: false, error: 'Applicant is already a team member of this startup' });
    }

    // Check if they are already in the Startup model teamMembers array
    const startup = await Startup.findById(application.startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const isAlreadyInStartupArray = startup.teamMembers.some(
      m => m.userId && m.userId.toString() === application.applicantId.toString()
    );
    if (isAlreadyInStartupArray) {
      return res.status(400).json({ success: false, error: 'Applicant is already in startup team list' });
    }

    let teamMemberCreated = null;
    let startupModified = false;
    let groupChatCreated = null;
    let groupChatModified = false;
    const originalStatus = application.status;

    try {
      // 1. Update application status to hired
      application.status = 'hired';
      application.hiredAt = new Date();
      await application.save();

      // 2. Add to StartupTeamMember
      teamMemberCreated = await StartupTeamMember.create({
        startupId: application.startupId,
        userId: application.applicantId,
        addedBy: req.user.id,
        sourceApplicationId: application._id,
        teamRole: teamRole || 'Developer',
        workMode: workMode || 'Remote',
        startDate: startDate || new Date(),
        status: 'active',
        joinedAt: new Date(),
        // legacy fields
        role: teamRole || 'Developer',
        name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
        image: applicantUser ? applicantUser.profileImage : '',
        linkedin: applicantUser?.socialLinks?.linkedin || ''
      });

      // 3. Update Startup model teamMembers array
      startup.teamMembers.push({
        userId: application.applicantId,
        name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
        role: teamRole || 'Developer',
        image: applicantUser ? applicantUser.profileImage : '',
        linkedin: applicantUser?.socialLinks?.linkedin || ''
      });
      await startup.save();
      startupModified = true;

      // 4. Add applicant to Startup Group Chat
      let groupChat = await Conversation.findOne({
        type: 'group',
        startupId: startup._id
      });

      if (!groupChat) {
        groupChat = await Conversation.findOne({
          isGroup: true,
          groupName: startup.name
        });
      }

      if (!groupChat) {
        groupChat = await Conversation.create({
          participants: [req.user.id, application.applicantId],
          initiator: req.user.id,
          type: 'group',
          isGroup: true,
          groupName: startup.name,
          groupAdmin: req.user.id,
          startupId: startup._id,
          status: 'accepted'
        });
        groupChatCreated = groupChat;
      } else {
        const hasParticipant = groupChat.participants.some(p => p.toString() === application.applicantId.toString());
        if (!hasParticipant) {
          groupChat.participants.push(application.applicantId);
          await groupChat.save();
          groupChatModified = true;
        }
      }

      // 5. Send Notification
      await sendNotify(req, application.applicantId, 'invite_accepted', teamMemberCreated._id, 'User', `You have been added to the ${startup.name} team as ${teamRole || 'Developer'}!`);

    } catch (dbErr) {
      console.error('Hiring rollback executed due to DB error:', dbErr);
      
      // Rollback application status
      application.status = originalStatus;
      application.hiredAt = undefined;
      await application.save();

      // Rollback team member creation
      if (teamMemberCreated) {
        await StartupTeamMember.deleteOne({ _id: teamMemberCreated._id });
      }

      // Rollback startup team members list update
      if (startupModified) {
        const startupObj = await Startup.findById(application.startupId);
        if (startupObj) {
          startupObj.teamMembers = startupObj.teamMembers.filter(
            m => m.userId && m.userId.toString() !== application.applicantId.toString()
          );
          await startupObj.save();
        }
      }

      // Rollback group chat addition
      if (groupChatCreated) {
        await Conversation.deleteOne({ _id: groupChatCreated._id });
      } else if (groupChatModified) {
        const gc = await Conversation.findOne({ type: 'group', startupId: application.startupId });
        if (gc) {
          gc.participants = gc.participants.filter(p => p.toString() !== application.applicantId.toString());
          await gc.save();
        }
      }
      throw dbErr;
    }

    // Synchronize Mail item status
    try {
      await Mail.findOneAndUpdate(
        { relatedApplicationId: application._id },
        { actionStatus: 'accepted', status: 'accepted' }
      );
    } catch (mailErr) {
      console.error('Failed to sync Mail status on application hire:', mailErr);
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// @desc    Get received role requests for all startups owned by this founder
// @route   GET /api/founder/role-requests
// @access  Private
router.get('/role-requests', protect, async (req, res) => {
  try {
    const startups = await Startup.find({ founderId: req.user.id });
    const startupIds = startups.map(s => s._id);

    const filter = { startupId: { $in: startupIds } };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const requests = await StartupRoleRequest.find(filter)
      .populate('applicantId', 'name fullName email profileImage headline skills socialLinks bio location jobSeekerProfile')
      .populate('startupId', 'name logo industry')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Update custom role request status directly
// @route   PATCH /api/founder/role-requests/:requestId/status
// @access  Private
router.patch('/role-requests/:requestId/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await StartupRoleRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    request.status = status;
    const startup = await Startup.findById(request.startupId);
    const startupName = startup ? startup.name : 'Startup';

    if (status === 'accepted') {
      // Auto-unlock messaging upon acceptance
      let conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, request.applicantId] },
        type: 'direct'
      });
      if (!conversation) {
        await Conversation.create({
          participants: [req.user.id, request.applicantId],
          initiator: req.user.id,
          type: 'direct',
          startupId: request.startupId,
          status: 'accepted'
        });
      } else if (conversation.status !== 'accepted') {
        conversation.status = 'accepted';
        await conversation.save();
      }

      await sendNotify(req, request.applicantId, 'invite_accepted', request._id, 'StartupRoleRequest', `Your custom role request to join ${startupName} has been accepted!`);
    } else if (status === 'rejected') {
      await sendNotify(req, request.applicantId, 'invite_rejected', request._id, 'StartupRoleRequest', `Your custom role request to join ${startupName} was not accepted.`);
    }

    await request.save();

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Connect with custom role applicant (unlocks messaging, status = connected)
// @route   POST /api/founder/role-requests/:requestId/connect
// @access  Private
router.post('/role-requests/:requestId/connect', protect, async (req, res) => {
  try {
    const request = await StartupRoleRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    request.status = 'connected';
    await request.save();

    // Unlock direct messaging
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, request.applicantId] },
      type: 'direct'
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, request.applicantId],
        initiator: req.user.id,
        type: 'direct',
        startupId: request.startupId,
        status: 'accepted'
      });
    } else {
      conversation.status = 'accepted';
      await conversation.save();
    }

    // Send notification
    const startup = await Startup.findById(request.startupId);
    await sendNotify(
      req, 
      request.applicantId, 
      'invite_accepted', 
      request._id, 
      'StartupRoleRequest', 
      `${req.user.fullName || req.user.name} wants to connect with you regarding your application to ${startup ? startup.name : 'Startup'}.`
    );

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Hire custom role applicant and add to startup team
// @route   POST /api/founder/role-requests/:requestId/hire
// @access  Private
router.post('/role-requests/:requestId/hire', protect, async (req, res) => {
  try {
    const { teamRole, startDate, workMode, notes } = req.body;
    const request = await StartupRoleRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    if (request.status === 'hired') {
      return res.status(400).json({ success: false, error: 'Applicant has already been hired' });
    }

    const applicantUser = await User.findById(request.applicantId);
    
    // Check if they are already in StartupTeamMember model
    const existingTeamMember = await StartupTeamMember.findOne({
      startupId: request.startupId,
      userId: request.applicantId
    });
    if (existingTeamMember) {
      return res.status(400).json({ success: false, error: 'Applicant is already a team member of this startup' });
    }

    // Check if they are already in the Startup model teamMembers array
    const startup = await Startup.findById(request.startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    const isAlreadyInStartupArray = startup.teamMembers.some(
      m => m.userId && m.userId.toString() === request.applicantId.toString()
    );
    if (isAlreadyInStartupArray) {
      return res.status(400).json({ success: false, error: 'Applicant is already in startup team list' });
    }

    const finalRole = teamRole || request.roleTitle || 'Team Member';

    let teamMemberCreated = null;
    let startupModified = false;
    let groupChatCreated = null;
    let groupChatModified = false;
    const originalStatus = request.status;

    try {
      // 1. Update request status to hired
      request.status = 'hired';
      await request.save();

      // 2. Add to StartupTeamMember
      teamMemberCreated = await StartupTeamMember.create({
        startupId: request.startupId,
        userId: request.applicantId,
        addedBy: req.user.id,
        teamRole: finalRole,
        workMode: workMode || 'Remote',
        startDate: startDate || new Date(),
        status: 'active',
        joinedAt: new Date(),
        // legacy fields
        role: finalRole,
        name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
        image: applicantUser ? applicantUser.profileImage : '',
        linkedin: applicantUser?.socialLinks?.linkedin || request.linkedin || ''
      });

      // 3. Update Startup model teamMembers array
      startup.teamMembers.push({
        userId: request.applicantId,
        name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
        role: finalRole,
        image: applicantUser ? applicantUser.profileImage : '',
        linkedin: applicantUser?.socialLinks?.linkedin || request.linkedin || ''
      });
      await startup.save();
      startupModified = true;

      // 4. Add applicant to Startup Group Chat
      let groupChat = await Conversation.findOne({
        type: 'group',
        startupId: startup._id
      });

      if (!groupChat) {
        groupChat = await Conversation.findOne({
          isGroup: true,
          groupName: startup.name
        });
      }

      if (!groupChat) {
        groupChat = await Conversation.create({
          participants: [req.user.id, request.applicantId],
          initiator: req.user.id,
          type: 'group',
          isGroup: true,
          groupName: startup.name,
          groupAdmin: req.user.id,
          startupId: startup._id,
          status: 'accepted'
        });
        groupChatCreated = groupChat;
      } else {
        const hasParticipant = groupChat.participants.some(p => p.toString() === request.applicantId.toString());
        if (!hasParticipant) {
          groupChat.participants.push(request.applicantId);
          await groupChat.save();
          groupChatModified = true;
        }
      }

      // 5. Send Notification
      await sendNotify(req, request.applicantId, 'invite_accepted', teamMemberCreated._id, 'User', `You have been added to the ${startup.name} team as ${finalRole}!`);

    } catch (dbErr) {
      console.error('Hiring custom role rollback executed due to DB error:', dbErr);
      
      // Rollback request status
      request.status = originalStatus;
      await request.save();

      // Rollback team member creation
      if (teamMemberCreated) {
        await StartupTeamMember.deleteOne({ _id: teamMemberCreated._id });
      }

      // Rollback startup team members list update
      if (startupModified) {
        const startupObj = await Startup.findById(request.startupId);
        if (startupObj) {
          startupObj.teamMembers = startupObj.teamMembers.filter(
            m => m.userId && m.userId.toString() !== request.applicantId.toString()
          );
          await startupObj.save();
        }
      }

      // Rollback group chat addition
      if (groupChatCreated) {
        await Conversation.deleteOne({ _id: groupChatCreated._id });
      } else if (groupChatModified) {
        const gc = await Conversation.findOne({ type: 'group', startupId: request.startupId });
        if (gc) {
          gc.participants = gc.participants.filter(p => p.toString() !== request.applicantId.toString());
          await gc.save();
        }
      }
      throw dbErr;
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// ==========================================
// FOUNDER PORTAL ROUTES
// ==========================================

// @desc    Get founder portal data
// @route   GET /api/founder/portal-data
// @access  Private (Founder only)
router.get('/portal-data', protect, async (req, res) => {
  try {
    if (req.user.role !== 'founder' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Only founders can view this portal.' });
    }

    const startups = await Startup.find({ founderId: req.user.id });
    const startupIds = startups.map(s => s._id);

    const applications = await JobApplication.find({ startupId: { $in: startupIds } })
      .populate('applicantId', 'name fullName email profileImage headline skills location socialLinks')
      .populate('jobId')
      .sort('-createdAt');

    const roleRequests = await StartupRoleRequest.find({ startupId: { $in: startupIds } })
      .populate('applicantId', 'name fullName email profileImage headline skills location socialLinks bio')
      .sort('-createdAt');

    const teamMembers = await StartupTeamMember.find({ startupId: { $in: startupIds } })
      .populate('userId', 'name fullName email profileImage headline skills location socialLinks')
      .sort('joinedAt');

    const investmentRequests = await InvestmentRequest.find({ startupId: { $in: startupIds } })
      .populate('investorId', 'name fullName email profileImage headline')
      .sort('-createdAt');

    const connectedInvestors = await InvestorStartupConnection.find({ startupId: { $in: startupIds } })
      .select('-privateNotes')
      .populate('investorId', 'name fullName email profileImage headline')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: {
        startups,
        applications,
        roleRequests,
        teamMembers,
        investmentRequests,
        connectedInvestors
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Update startup details
// @route   PUT /api/founder/startup/:id
// @access  Private (Founder only)
router.put('/startup/:id', protect, async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this startup' });
    }

    const {
      name,
      oneLinePitch,
      description,
      industry,
      stage,
      website,
      logo,
      pitchDeck,
      problemStatement,
      solution,
      fundingNeeded,
      teamSize,
      location,
      hiringStatus,
      investmentStatus,
      revenueStatus,
      traction
    } = req.body;

    if (name) startup.name = name;
    if (oneLinePitch) startup.oneLinePitch = oneLinePitch;
    if (description) startup.description = description;
    if (industry) startup.industry = industry;
    if (stage) startup.stage = stage;
    if (website !== undefined) startup.website = website;
    if (logo !== undefined) startup.logo = logo;
    if (pitchDeck !== undefined) startup.pitchDeck = pitchDeck;
    if (problemStatement !== undefined) startup.problemStatement = problemStatement;
    if (solution !== undefined) startup.solution = solution;
    if (fundingNeeded !== undefined) startup.fundingNeeded = Number(fundingNeeded) || 0;
    if (teamSize !== undefined) startup.teamSize = Number(teamSize) || 1;
    if (location) {
      startup.location = {
        city: location.city || startup.location?.city || '',
        country: location.country || startup.location?.country || '',
        remote: location.remote !== undefined ? location.remote : (startup.location?.remote || false)
      };
    }
    if (hiringStatus !== undefined) startup.hiringStatus = hiringStatus;
    if (investmentStatus !== undefined) startup.investmentStatus = investmentStatus;
    if (revenueStatus !== undefined) startup.revenueStatus = revenueStatus;
    if (traction !== undefined) startup.traction = traction;

    await startup.save();

    res.status(200).json({
      success: true,
      data: startup
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// @desc    Update application stage
// @route   PATCH /api/founder/applications/:id/stage
// @access  Private (Founder only)
router.patch('/applications/:id/stage', protect, async (req, res) => {
  try {
    const { status, type } = req.body;
    let application;
    if (type === 'RoleRequest') {
      application = await StartupRoleRequest.findById(req.params.id);
    } else {
      application = await JobApplication.findById(req.params.id);
    }

    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this application' });
    }

    application.status = status;
    if (status === 'accepted') {
      application.acceptedAt = new Date();
    } else if (status === 'rejected') {
      application.rejectedAt = new Date();
    } else if (status === 'connected') {
      application.connectedAt = new Date();
    } else if (status === 'reviewed') {
      application.reviewedAt = new Date();
    }

    await application.save();

    // Synchronize Mail item status
    try {
      const mailActionStatus = status === 'accepted' ? 'accepted' : status === 'rejected' ? 'rejected' : status === 'connected' ? 'connected' : (status === 'shortlisted' || status === 'reviewed') ? 'interview' : 'none';
      await Mail.findOneAndUpdate(
        { relatedApplicationId: application._id },
        { actionStatus: mailActionStatus, status }
      );
    } catch (mailErr) {
      console.error('Failed to sync Mail status on application stage update:', mailErr);
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Accept investor interest request
// @route   POST /api/founder/investor-requests/:requestId/accept
// @access  Private (Founder only)
router.post('/investor-requests/:requestId/accept', protect, async (req, res) => {
  try {
    const request = await InvestmentRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Investor request not found' });
    }

    if (request.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this request' });
    }

    const existingConnection = await InvestorStartupConnection.findOne({
      startupId: request.startupId,
      investorId: request.investorId
    });

    if (existingConnection) {
      return res.status(400).json({ success: false, error: 'Connection already exists between this investor and startup' });
    }

    let connectionCreated = null;
    let conversationCreated = null;

    try {
      connectionCreated = await InvestorStartupConnection.create({
        startupId: request.startupId,
        investorId: request.investorId,
        founderId: request.founderId,
        status: 'connected',
        pipelineStage: 'Connected'
      });

      let conversation = await Conversation.findOne({
        participants: { $all: [request.investorId, request.founderId] },
        type: 'direct'
      });

      if (!conversation) {
        conversationCreated = await Conversation.create({
          participants: [request.investorId, request.founderId],
          initiator: request.founderId,
          type: 'direct',
          startupId: request.startupId,
          status: 'accepted'
        });
      } else if (conversation.status !== 'accepted') {
        const oldStatus = conversation.status;
        conversation.status = 'accepted';
        await conversation.save();
        conversationCreated = { conversation, oldStatus };
      }

      request.status = 'accepted';
      await request.save();

      await sendNotify(req, request.investorId, 'investment_request_accepted', request._id, 'InvestmentRequest', `Your investment request has been accepted by the founder!`);

    } catch (dbErr) {
      console.error('Accept request rollback execution due to DB error:', dbErr);
      if (connectionCreated) {
        await InvestorStartupConnection.deleteOne({ _id: connectionCreated._id });
      }
      if (conversationCreated) {
        if (conversationCreated.oldStatus) {
          conversationCreated.conversation.status = conversationCreated.oldStatus;
          await conversationCreated.conversation.save();
        } else {
          await Conversation.deleteOne({ _id: conversationCreated._id });
        }
      }
      throw dbErr;
    }

    // Synchronize Mail item status
    try {
      await Mail.findOneAndUpdate(
        { relatedInvestmentRequestId: request._id },
        { actionStatus: 'accepted', status: 'accepted' }
      );
    } catch (mailErr) {
      console.error('Failed to sync Mail status on investor request accept:', mailErr);
    }

    res.status(200).json({
      success: true,
      message: 'Investor request accepted, connection established, and chat room unlocked!'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// @desc    Reject investor interest request
// @route   POST /api/founder/investor-requests/:requestId/reject
// @access  Private (Founder only)
router.post('/investor-requests/:requestId/reject', protect, async (req, res) => {
  try {
    const request = await InvestmentRequest.findById(req.params.requestId);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Investor request not found' });
    }

    if (request.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this request' });
    }

    request.status = 'rejected';
    await request.save();

    await sendNotify(req, request.investorId, 'investment_request_rejected', request._id, 'InvestmentRequest', `Your investment request was declined.`);

    // Synchronize Mail item status
    try {
      await Mail.findOneAndUpdate(
        { relatedInvestmentRequestId: request._id },
        { actionStatus: 'rejected', status: 'rejected' }
      );
    } catch (mailErr) {
      console.error('Failed to sync Mail status on investor request reject:', mailErr);
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Mark investor as invested
// @route   POST /api/founder/connections/:connectionId/invested
// @access  Private (Founder only)
router.post('/connections/:connectionId/invested', protect, async (req, res) => {
  try {
    const connection = await InvestorStartupConnection.findById(req.params.connectionId);
    if (!connection) {
      return res.status(404).json({ success: false, error: 'Connection not found' });
    }

    if (connection.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this connection' });
    }

    const { investmentAmount, equityPercentage } = req.body;

    connection.status = 'invested';
    connection.pipelineStage = 'Invested';
    connection.investmentAmount = Number(investmentAmount) || 0;
    connection.equityPercentage = Number(equityPercentage) || 0;
    connection.investedAt = new Date();
    await connection.save();

    await sendNotify(req, connection.investorId, 'investment_completed', connection._id, 'InvestorStartupConnection', `You have been officially marked as an investor in the startup!`);

    // Synchronize Mail item status
    try {
      await Mail.findOneAndUpdate(
        { relatedConnectionId: connection._id },
        { actionStatus: 'invested', status: 'invested' }
      );
      // Fallback update
      await Mail.findOneAndUpdate(
        { relatedStartupId: connection.startupId, type: 'investment_request', $or: [{ senderId: connection.investorId }, { receiverId: connection.investorId }] },
        { actionStatus: 'invested', status: 'invested' }
      );
    } catch (mailErr) {
      console.error('Failed to sync Mail status on connection marked invested:', mailErr);
    }

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Create startup update
// @route   POST /api/founder/updates
// @access  Private (Founder only)
router.post('/updates', protect, async (req, res) => {
  try {
    const { startupId, title, description, updateType, attachmentUrl, visibleToConnectedInvestors } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to post updates for this startup' });
    }

    const update = await StartupUpdate.create({
      startupId,
      founderId: req.user.id,
      title,
      description,
      updateType: updateType || 'General',
      attachmentUrl: attachmentUrl || '',
      visibleToConnectedInvestors: visibleToConnectedInvestors !== undefined ? visibleToConnectedInvestors : true
    });

    // Send mail & notification to connected and invested investors
    try {
      const Notification = require('../models/Notification');
      const connections = await InvestorStartupConnection.find({ 
        startupId, 
        status: { $in: ['connected', 'invested'] } 
      });
      const senderUser = await User.findById(req.user.id);
      const io = req.app.get('io');

      for (const conn of connections) {
        const receiverUser = await User.findById(conn.investorId);
        if (receiverUser) {
          // Send Mail
          await Mail.create({
            senderId: req.user.id,
            receiverId: conn.investorId,
            senderProfileName: senderUser?.fullName || senderUser?.name || '',
            receiverProfileName: receiverUser?.fullName || receiverUser?.name || '',
            senderRole: senderUser?.role || '',
            receiverRole: receiverUser?.role || '',
            subject: `New Founder Update from ${startup.name}: ${title}`,
            body: `Hi ${receiverUser.fullName || receiverUser.name},\n\nWe have posted a new ${updateType || 'General'} update for ${startup.name}:\n\n${description}${attachmentUrl ? `\n\nAttachment/Link: ${attachmentUrl}` : ''}\n\nBest,\n${senderUser?.fullName || senderUser?.name}`,
            type: 'founder_update',
            status: 'pending',
            actionStatus: 'none',
            relatedStartupId: startupId,
            isRead: false,
            attachments: attachmentUrl ? [attachmentUrl] : []
          });

          // Create Notification
          const notification = await Notification.create({
            recipient: conn.investorId,
            sender: req.user.id,
            type: 'founder_update',
            entityId: update._id,
            entityType: 'StartupUpdate',
            content: `New update posted by ${startup.name}: ${title}`
          });

          // Emit real-time notification
          if (io) {
            io.to(conn.investorId.toString()).emit('new_notification', notification);
          }
        }
      }
    } catch (mailErr) {
      console.error('Failed to send startup update emails/notifications:', mailErr);
    }

    res.status(201).json({
      success: true,
      data: update
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Founder adds a team member manually
// @route   POST /api/founder/team/add-manual
// @access  Private (Founder only)
router.post('/team/add-manual', protect, async (req, res) => {
  try {
    const { startupId, email, role, workMode } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User with this email not found on FounderX.' });
    }

    const existingMember = await StartupTeamMember.findOne({
      startupId,
      userId: targetUser._id
    });

    if (existingMember) {
      return res.status(400).json({ success: false, error: 'User is already a team member of this startup' });
    }

    const teamMember = await StartupTeamMember.create({
      startupId,
      userId: targetUser._id,
      addedBy: req.user.id,
      teamRole: role || 'Team Member',
      workMode: workMode || 'Remote',
      startDate: new Date(),
      status: 'active',
      role: role || 'Team Member',
      name: targetUser.fullName || targetUser.name,
      image: targetUser.profileImage || '',
      linkedin: targetUser.socialLinks?.linkedin || ''
    });

    const isAlreadyInStartupArray = startup.teamMembers.some(
      m => m.userId && m.userId.toString() === targetUser._id.toString()
    );
    if (!isAlreadyInStartupArray) {
      startup.teamMembers.push({
        userId: targetUser._id,
        name: targetUser.fullName || targetUser.name,
        role: role || 'Team Member',
        image: targetUser.profileImage || '',
        linkedin: targetUser.socialLinks?.linkedin || ''
      });
      await startup.save();
    }

    res.status(201).json({
      success: true,
      data: teamMember
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message || 'Server Error' });
  }
});

// @desc    Remove team member
// @route   DELETE /api/founder/team/:memberId
// @access  Private (Founder only)
router.delete('/team/:memberId', protect, async (req, res) => {
  try {
    const member = await StartupTeamMember.findById(req.params.memberId);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Team member not found' });
    }

    const startup = await Startup.findById(member.startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await StartupTeamMember.deleteOne({ _id: member._id });

    startup.teamMembers = startup.teamMembers.filter(
      m => m.userId && m.userId.toString() !== member.userId.toString()
    );
    await startup.save();

    res.status(200).json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Update team member status/role
// @route   PATCH /api/founder/team/:memberId
// @access  Private (Founder only)
router.patch('/team/:memberId', protect, async (req, res) => {
  try {
    const { teamRole, status } = req.body;
    const member = await StartupTeamMember.findById(req.params.memberId);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Team member not found' });
    }

    const startup = await Startup.findById(member.startupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup not found' });
    }

    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    if (teamRole) {
      member.teamRole = teamRole;
      member.role = teamRole;
    }
    if (status) {
      member.status = status;
    }

    await member.save();

    const memberIdx = startup.teamMembers.findIndex(
      m => m.userId && m.userId.toString() === member.userId.toString()
    );
    if (memberIdx > -1) {
      if (teamRole) startup.teamMembers[memberIdx].role = teamRole;
      await startup.save();
    }

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
