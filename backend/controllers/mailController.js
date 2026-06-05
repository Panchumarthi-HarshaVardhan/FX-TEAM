const { 
  Mail, User, Startup, InvestmentRequest, JobApplication, 
  StartupRoleRequest, InvestorStartupConnection, StartupTeamMember, Conversation 
} = require('../models');
const Notification = require('../models/Notification');

// Helper to create notifications and emit socket events robustly
const sendNotify = async (req, recipientId, type, entityId, entityType, messageText) => {
  try {
    const notification = await Notification.create({
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
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId.toString()).emit('new_notification', notification);
    }
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// @desc    Get received mails for inbox
// @route   GET /api/mail/inbox
// @access  Private
exports.getInbox = async (req, res) => {
  try {
    const mails = await Mail.find({
      receiverId: req.user.id,
      isArchivedByReceiver: false,
      isDeletedByReceiver: false
    })
    .populate('senderId', 'name fullName email profileImage role username')
    .populate('relatedStartupId', 'name industry logo')
    .populate('relatedInvestmentRequestId')
    .sort('-createdAt');

    res.status(200).json({ success: true, data: mails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get sent mails
// @route   GET /api/mail/sent
// @access  Private
exports.getSent = async (req, res) => {
  try {
    const mails = await Mail.find({
      senderId: req.user.id,
      isDeletedBySender: false
    })
    .populate('receiverId', 'name fullName email profileImage role username')
    .populate('relatedStartupId', 'name industry logo')
    .populate('relatedInvestmentRequestId')
    .sort('-createdAt');

    res.status(200).json({ success: true, data: mails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get actionable requests
// @route   GET /api/mail/requests
// @access  Private
exports.getRequests = async (req, res) => {
  try {
    const mails = await Mail.find({
      receiverId: req.user.id,
      isDeletedByReceiver: false,
      type: { $in: ['investment_request', 'application_request', 'cofounder_request', 'meeting_request'] }
    })
    .populate('senderId', 'name fullName email profileImage role username')
    .populate('relatedStartupId', 'name industry logo')
    .populate('relatedInvestmentRequestId')
    .sort('-createdAt');

    res.status(200).json({ success: true, data: mails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get starred mails
// @route   GET /api/mail/starred
// @access  Private
exports.getStarred = async (req, res) => {
  try {
    const userId = req.user.id;
    const mails = await Mail.find({
      $or: [
        { receiverId: userId, isDeletedByReceiver: false, isStarred: true },
        { senderId: userId, isDeletedBySender: false, isStarred: true }
      ]
    })
    .populate('senderId', 'name fullName email profileImage role username')
    .populate('receiverId', 'name fullName email profileImage role username')
    .populate('relatedStartupId', 'name industry logo')
    .populate('relatedInvestmentRequestId')
    .sort('-createdAt');

    res.status(200).json({ success: true, data: mails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get archived mails
// @route   GET /api/mail/archived
// @access  Private
exports.getArchived = async (req, res) => {
  try {
    const mails = await Mail.find({
      receiverId: req.user.id,
      isArchivedByReceiver: true,
      isDeletedByReceiver: false
    })
    .populate('senderId', 'name fullName email profileImage role username')
    .populate('relatedStartupId', 'name industry logo')
    .populate('relatedInvestmentRequestId')
    .sort('-createdAt');

    res.status(200).json({ success: true, data: mails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get trash/deleted mails
// @route   GET /api/mail/trash
// @access  Private
exports.getTrash = async (req, res) => {
  try {
    const userId = req.user.id;
    const mails = await Mail.find({
      $or: [
        { receiverId: userId, isDeletedByReceiver: true },
        { senderId: userId, isDeletedBySender: true }
      ]
    })
    .populate('senderId', 'name fullName email profileImage role username')
    .populate('receiverId', 'name fullName email profileImage role username')
    .populate('relatedStartupId', 'name industry logo')
    .populate('relatedInvestmentRequestId')
    .sort('-createdAt');

    res.status(200).json({ success: true, data: mails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get specific mail details
// @route   GET /api/mail/:id
// @access  Private
exports.getMailById = async (req, res) => {
  try {
    const mail = await Mail.findById(req.params.id)
      .populate('senderId', 'name fullName email profileImage role username bio location socialLinks')
      .populate('receiverId', 'name fullName email profileImage role username')
      .populate('relatedStartupId')
      .populate('relatedInvestmentRequestId');

    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    // Auth check: User must be sender or receiver
    if (mail.senderId._id.toString() !== req.user.id && mail.receiverId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to view this mail' });
    }

    res.status(200).json({ success: true, data: mail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Search users for mail compose
// @route   GET /api/mail/users/search
// @access  Private
exports.getUserSearch = async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query) {
      return res.status(200).json({ success: true, data: [] });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { fullName: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user.id }
    })
    .select('_id name fullName username profileImage role')
    .limit(10);

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Compose and send a new mail
// @route   POST /api/mail/compose
// @access  Private
exports.composeMail = async (req, res) => {
  try {
    const { receiverUsername, receiverId, subject, body, type, relatedStartupId, attachments } = req.body;

    let receiver = null;
    if (receiverId) {
      receiver = await User.findById(receiverId);
    } else if (receiverUsername) {
      receiver = await User.findOne({ username: receiverUsername.toLowerCase() });
    }

    if (!receiver) {
      return res.status(400).json({ success: false, error: 'Recipient user not found' });
    }

    // Validate related startup exists if provided
    if (relatedStartupId) {
      const startup = await Startup.findById(relatedStartupId);
      if (!startup) {
        return res.status(400).json({ success: false, error: 'Linked startup not found' });
      }
    }

    // Prevent duplicate request mails for same startup and same sender (e.g. cofounder or application requests)
    if (type && ['investment_request', 'application_request', 'cofounder_request'].includes(type) && relatedStartupId) {
      const existingRequestMail = await Mail.findOne({
        senderId: req.user.id,
        receiverId: receiver._id,
        relatedStartupId,
        type,
        actionStatus: 'pending'
      });
      if (existingRequestMail) {
        return res.status(400).json({ success: false, error: 'A pending request mail already exists for this startup' });
      }
    }

    const mail = await Mail.create({
      senderId: req.user.id,
      receiverId: receiver._id,
      senderProfileName: req.user.fullName || req.user.name,
      receiverProfileName: receiver.fullName || receiver.name,
      senderRole: req.user.role,
      receiverRole: receiver.role,
      subject,
      body,
      type: type || 'normal',
      actionStatus: type && type !== 'normal' ? 'pending' : 'none',
      relatedStartupId,
      attachments: attachments || [],
      isRead: false
    });

    // Notify receiver
    await sendNotify(req, receiver._id, 'mail_received', mail._id, 'Mail', `New message: ${subject}`);

    res.status(201).json({ success: true, data: mail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Reply to a mail
// @route   POST /api/mail/:id/reply
// @access  Private
exports.replyMail = async (req, res) => {
  try {
    const { body } = req.body;
    const parentMail = await Mail.findById(req.params.id);

    if (!parentMail) {
      return res.status(404).json({ success: false, error: 'Parent mail not found' });
    }

    if (parentMail.senderId.toString() !== req.user.id && parentMail.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to reply to this mail' });
    }

    const recipientId = parentMail.senderId.toString() === req.user.id ? parentMail.receiverId : parentMail.senderId;
    const receiver = await User.findById(recipientId);

    if (!receiver) {
      return res.status(400).json({ success: false, error: 'Recipient user not found' });
    }

    const replySubject = parentMail.subject.startsWith('Re:') ? parentMail.subject : `Re: ${parentMail.subject}`;

    const mail = await Mail.create({
      senderId: req.user.id,
      receiverId: receiver._id,
      senderProfileName: req.user.fullName || req.user.name,
      receiverProfileName: receiver.fullName || receiver.name,
      senderRole: req.user.role,
      receiverRole: receiver.role,
      subject: replySubject,
      body,
      type: 'normal',
      actionStatus: 'none',
      relatedStartupId: parentMail.relatedStartupId,
      isRead: false
    });

    // Notify receiver
    await sendNotify(req, receiver._id, 'mail_received', mail._id, 'Mail', `Reply: ${replySubject}`);

    res.status(201).json({ success: true, data: mail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Mark mail as read
// @route   PATCH /api/mail/:id/read
// @access  Private
exports.markRead = async (req, res) => {
  try {
    const mail = await Mail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    if (mail.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    mail.isRead = true;
    await mail.save();

    res.status(200).json({ success: true, data: mail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Mark mail as unread
// @route   PATCH /api/mail/:id/unread
// @access  Private
exports.markUnread = async (req, res) => {
  try {
    const mail = await Mail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    if (mail.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    mail.isRead = false;
    await mail.save();

    res.status(200).json({ success: true, data: mail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Toggle star on mail
// @route   PATCH /api/mail/:id/star
// @access  Private
exports.toggleStar = async (req, res) => {
  try {
    const mail = await Mail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    if (mail.senderId.toString() !== req.user.id && mail.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    mail.isStarred = !mail.isStarred;
    await mail.save();

    res.status(200).json({ success: true, data: mail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Archive mail
// @route   PATCH /api/mail/:id/archive
// @access  Private
exports.archiveMail = async (req, res) => {
  try {
    const mail = await Mail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    if (mail.receiverId.toString() === req.user.id) {
      mail.isArchivedByReceiver = true;
    } else if (mail.senderId.toString() === req.user.id) {
      mail.isArchivedBySender = true;
    } else {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await mail.save();
    res.status(200).json({ success: true, data: mail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Restore mail from archive/trash
// @route   PATCH /api/mail/:id/restore
// @access  Private
exports.restoreMail = async (req, res) => {
  try {
    const mail = await Mail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    if (mail.receiverId.toString() === req.user.id) {
      mail.isArchivedByReceiver = false;
      mail.isDeletedByReceiver = false;
    } else if (mail.senderId.toString() === req.user.id) {
      mail.isArchivedBySender = false;
      mail.isDeletedBySender = false;
    } else {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await mail.save();
    res.status(200).json({ success: true, data: mail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Soft delete mail
// @route   DELETE /api/mail/:id
// @access  Private
exports.deleteMail = async (req, res) => {
  try {
    const mail = await Mail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    if (mail.receiverId.toString() === req.user.id) {
      mail.isDeletedByReceiver = true;
    } else if (mail.senderId.toString() === req.user.id) {
      mail.isDeletedBySender = true;
    } else {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await mail.save();
    res.status(200).json({ success: true, message: 'Mail soft-deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// ==========================================
// ACTION CONTROLLERS FOR MAIL
// ==========================================

// @desc    Accept request mail
// @route   POST /api/mail/:id/accept
// @access  Private
exports.acceptRequest = async (req, res) => {
  try {
    const mail = await Mail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    if (mail.receiverId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only recipient can act on this request' });
    }

    if (['accepted', 'rejected', 'invested', 'withdrawn'].includes(mail.actionStatus)) {
      return res.status(400).json({ success: false, error: 'This request is already handled' });
    }

    const startup = await Startup.findById(mail.relatedStartupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup related to this mail not found' });
    }

    // Owner authorization
    if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this startup requests' });
    }

    // 1. INVESTOR INTEREST ACCEPTANCE
    if (mail.type === 'investment_request') {
      const request = await InvestmentRequest.findById(mail.relatedInvestmentRequestId);
      if (!request) {
        return res.status(404).json({ success: false, error: 'Investment request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ success: false, error: 'Investment request is already processed' });
      }

      if (request.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Not authorized to manage this investment request' });
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

        mail.actionStatus = 'accepted';
        mail.status = 'accepted';
        await mail.save();

        // Create confirmation mail to investor
        await Mail.create({
          senderId: req.user.id,
          receiverId: request.investorId,
          senderProfileName: req.user.fullName || req.user.name,
          receiverProfileName: mail.senderProfileName,
          senderRole: req.user.role,
          receiverRole: mail.senderRole,
          subject: `Accepted: Investment request for ${startup.name}`,
          body: `Hi ${mail.senderProfileName},\n\nWe have accepted your investment interest request for ${startup.name}. Our direct messaging is now unlocked, and you can view our team updates. Let's schedule a meeting to connect.\n\nBest,\n${req.user.fullName || req.user.name}`,
          type: 'status_update',
          actionStatus: 'none',
          relatedStartupId: request.startupId,
          relatedConnectionId: connectionCreated._id,
          isRead: false
        });

        await sendNotify(req, request.investorId, 'investment_request_accepted', request._id, 'InvestmentRequest', `Your investment request has been accepted by the founder!`);

      } catch (dbErr) {
        console.error('Accept investment request rollback due to error:', dbErr);
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
    }

    // 2. JOB APPLICATION / CUSTOM ROLE ACCEPTANCE (HIRE)
    else if (mail.type === 'application_request' || mail.type === 'cofounder_request') {
      const isRoleRequest = mail.type === 'cofounder_request' || (mail.relatedApplicationId && mail.subject.toLowerCase().includes('role request'));
      
      let application = null;
      let applicantId = null;
      let teamRole = 'Developer';

      if (isRoleRequest) {
        application = await StartupRoleRequest.findById(mail.relatedApplicationId);
        if (!application) {
          return res.status(404).json({ success: false, error: 'Custom role request not found' });
        }
        applicantId = application.applicantId;
        teamRole = application.roleTitle || 'Team Member';
      } else {
        application = await JobApplication.findById(mail.relatedApplicationId);
        if (!application) {
          return res.status(404).json({ success: false, error: 'Job application not found' });
        }
        applicantId = application.applicantId;
        const jobOpening = await Startup.findOne({ 'jobs._id': application.jobId });
        if (jobOpening) {
          const subJob = jobOpening.jobs.id(application.jobId);
          teamRole = subJob ? subJob.title : 'Developer';
        }
      }

      // Check duplicate team member
      const existingTeamMember = await StartupTeamMember.findOne({
        startupId: startup._id,
        userId: applicantId
      });
      if (existingTeamMember) {
        return res.status(400).json({ success: false, error: 'Applicant is already a team member of this startup' });
      }

      const isAlreadyInStartupArray = startup.teamMembers.some(
        m => m.userId && m.userId.toString() === applicantId.toString()
      );
      if (isAlreadyInStartupArray) {
        return res.status(400).json({ success: false, error: 'Applicant is already in startup team list' });
      }

      const applicantUser = await User.findById(applicantId);

      let teamMemberCreated = null;
      let startupModified = false;
      let groupChatCreated = null;
      let groupChatModified = false;
      const originalStatus = application.status;

      try {
        // 1. Update application status to hired
        application.status = 'hired';
        if (!isRoleRequest) application.hiredAt = new Date();
        await application.save();

        // 2. Add to StartupTeamMember
        teamMemberCreated = await StartupTeamMember.create({
          startupId: startup._id,
          userId: applicantId,
          addedBy: req.user.id,
          sourceApplicationId: application._id,
          teamRole,
          workMode: 'Remote',
          startDate: new Date(),
          status: 'active',
          joinedAt: new Date(),
          role: teamRole,
          name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
          image: applicantUser ? applicantUser.profileImage : '',
          linkedin: applicantUser?.socialLinks?.linkedin || ''
        });

        // 3. Update Startup model teamMembers array
        startup.teamMembers.push({
          userId: applicantId,
          name: applicantUser ? applicantUser.fullName || applicantUser.name : 'Team Member',
          role: teamRole,
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
            participants: [req.user.id, applicantId],
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
          const hasParticipant = groupChat.participants.some(p => p.toString() === applicantId.toString());
          if (!hasParticipant) {
            groupChat.participants.push(applicantId);
            await groupChat.save();
            groupChatModified = true;
          }
        }

        mail.actionStatus = 'accepted';
        mail.status = 'accepted';
        await mail.save();

        // Create confirmation mail to applicant
        await Mail.create({
          senderId: req.user.id,
          receiverId: applicantId,
          senderProfileName: req.user.fullName || req.user.name,
          receiverProfileName: mail.senderProfileName,
          senderRole: req.user.role,
          receiverRole: mail.senderRole,
          subject: `Offer Accepted: Hired for ${teamRole} at ${startup.name}`,
          body: `Hi ${mail.senderProfileName},\n\nCongratulations! We have accepted your application and you are officially added to the ${startup.name} team as a ${teamRole}. You have also been added to our team group chat room.\n\nWelcome to the team!\n\nBest,\n${req.user.fullName || req.user.name}`,
          type: 'status_update',
          actionStatus: 'none',
          relatedStartupId: startup._id,
          isRead: false
        });

        await sendNotify(req, applicantId, 'invite_accepted', teamMemberCreated._id, 'User', `You have been added to the ${startup.name} team as ${teamRole}!`);

      } catch (dbErr) {
        console.error('Accept hiring request rollback due to error:', dbErr);
        application.status = originalStatus;
        if (!isRoleRequest) application.hiredAt = undefined;
        await application.save();

        if (teamMemberCreated) {
          await StartupTeamMember.deleteOne({ _id: teamMemberCreated._id });
        }

        if (startupModified) {
          const startupObj = await Startup.findById(startup._id);
          if (startupObj) {
            startupObj.teamMembers = startupObj.teamMembers.filter(
              m => m.userId && m.userId.toString() !== applicantId.toString()
            );
            await startupObj.save();
          }
        }

        if (groupChatCreated) {
          await Conversation.deleteOne({ _id: groupChatCreated._id });
        } else if (groupChatModified) {
          const gc = await Conversation.findOne({ type: 'group', startupId: startup._id });
          if (gc) {
            gc.participants = gc.participants.filter(p => p.toString() !== applicantId.toString());
            await gc.save();
          }
        }
        throw dbErr;
      }
    }

    res.status(200).json({ success: true, message: 'Request accepted, database state synchronized successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message || 'Server Error' });
  }
};

// @desc    Reject request mail
// @route   POST /api/mail/:id/reject
// @access  Private
exports.rejectRequest = async (req, res) => {
  try {
    const mail = await Mail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    if (mail.receiverId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only recipient can reject this request' });
    }

    if (['accepted', 'rejected', 'invested', 'withdrawn'].includes(mail.actionStatus)) {
      return res.status(400).json({ success: false, error: 'This request is already handled' });
    }

    const startup = await Startup.findById(mail.relatedStartupId);
    if (!startup) {
      return res.status(404).json({ success: false, error: 'Startup related to this request not found' });
    }

    if (mail.type === 'investment_request') {
      const request = await InvestmentRequest.findById(mail.relatedInvestmentRequestId);
      if (!request) {
        return res.status(404).json({ success: false, error: 'Investment request not found' });
      }

      if (request.status !== 'pending') {
        return res.status(400).json({ success: false, error: 'Investment request is already processed' });
      }

      if (request.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Not authorized to manage this investment request' });
      }

      if (startup.founderId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Not authorized to manage this startup' });
      }

      request.status = 'rejected';
      await request.save();
      
      mail.actionStatus = 'rejected';
      mail.status = 'rejected';
      await mail.save();

      // Create status update mail to investor
      await Mail.create({
        senderId: req.user.id,
        receiverId: mail.senderId,
        senderProfileName: req.user.fullName || req.user.name,
        receiverProfileName: mail.senderProfileName,
        senderRole: req.user.role,
        receiverRole: mail.senderRole,
        subject: `Declined: Investment request for ${startup.name}`,
        body: `Hi ${mail.senderProfileName},\n\nThank you for your interest in investing in ${startup.name}. At this moment, we are declining this request as we are not raising details in this range or with this profile. We will keep you updated on future rounds.\n\nBest,\n${req.user.fullName || req.user.name}`,
        type: 'status_update',
        actionStatus: 'none',
        relatedStartupId: mail.relatedStartupId,
        isRead: false
      });

      await sendNotify(req, mail.senderId, 'investment_request_rejected', request ? request._id : mail._id, 'InvestmentRequest', `Your investment request was declined.`);
    } 
    else if (mail.type === 'application_request' || mail.type === 'cofounder_request') {
      const isRoleRequest = mail.type === 'cofounder_request' || (mail.relatedApplicationId && mail.subject.toLowerCase().includes('role request'));
      
      let application = null;
      let applicantId = null;

      if (isRoleRequest) {
        application = await StartupRoleRequest.findById(mail.relatedApplicationId);
        if (application) {
          application.status = 'rejected';
          await application.save();
          applicantId = application.applicantId;
        }
      } else {
        application = await JobApplication.findById(mail.relatedApplicationId);
        if (application) {
          application.status = 'rejected';
          await application.save();
          applicantId = application.applicantId;
        }
      }

      mail.actionStatus = 'rejected';
      mail.status = 'rejected';
      await mail.save();

      if (applicantId) {
        // Create rejection mail
        await Mail.create({
          senderId: req.user.id,
          receiverId: applicantId,
          senderProfileName: req.user.fullName || req.user.name,
          receiverProfileName: mail.senderProfileName,
          senderRole: req.user.role,
          receiverRole: mail.senderRole,
          subject: `Update on your application at ${startup.name}`,
          body: `Hi ${mail.senderProfileName},\n\nThank you for applying to join ${startup.name}. After careful consideration, we have decided not to move forward with your application at this time. We appreciate your time and interest in our startup.\n\nBest,\n${req.user.fullName || req.user.name}`,
          type: 'status_update',
          actionStatus: 'none',
          relatedStartupId: startup._id,
          isRead: false
        });

        await sendNotify(req, applicantId, 'invite_rejected', application ? application._id : mail._id, 'JobApplication', `Your application for the role was rejected.`);
      }
    }

    res.status(200).json({ success: true, message: 'Request rejected' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Connect request mail
// @route   POST /api/mail/:id/connect
// @access  Private
exports.connectRequest = async (req, res) => {
  try {
    const mail = await Mail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    if (mail.receiverId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only recipient can unlock chat connection' });
    }

    if (mail.actionStatus === 'none' || mail.actionStatus === 'rejected') {
      return res.status(400).json({ success: false, error: 'Cannot connect this request type' });
    }

    const isRoleRequest = mail.type === 'cofounder_request';
    const startup = await Startup.findById(mail.relatedStartupId);
    
    if (isRoleRequest) {
      const request = await StartupRoleRequest.findById(mail.relatedApplicationId);
      if (request) {
        request.status = 'connected';
        await request.save();
      }
    } else if (mail.type === 'application_request') {
      const application = await JobApplication.findById(mail.relatedApplicationId);
      if (application) {
        application.status = 'connected';
        await application.save();
      }
    }

    // Unlock messaging by creating / updating Conversation status to 'accepted'
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, mail.senderId] },
      type: 'direct'
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, mail.senderId],
        initiator: req.user.id,
        type: 'direct',
        startupId: mail.relatedStartupId,
        status: 'accepted'
      });
    } else {
      conversation.status = 'accepted';
      await conversation.save();
    }

    mail.actionStatus = 'connected';
    mail.status = 'connected';
    await mail.save();

    await sendNotify(req, mail.senderId, 'invite_accepted', mail.relatedApplicationId || mail._id, 'JobApplication', `${req.user.fullName || req.user.name} wants to connect with you for the role at ${startup ? startup.name : 'Startup'}.`);

    res.status(200).json({ success: true, message: 'Connected successfully. Direct message chat is unlocked!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Interview request mail
// @route   POST /api/mail/:id/interview
// @access  Private
exports.interviewRequest = async (req, res) => {
  try {
    const mail = await Mail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    if (mail.receiverId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Only recipient can schedule interviews' });
    }

    const isRoleRequest = mail.type === 'cofounder_request';

    if (isRoleRequest) {
      const request = await StartupRoleRequest.findById(mail.relatedApplicationId);
      if (request) {
        request.status = 'reviewed';
        await request.save();
      }
    } else if (mail.type === 'application_request') {
      const application = await JobApplication.findById(mail.relatedApplicationId);
      if (application) {
        application.status = 'shortlisted';
        await application.save();
      }
    }

    mail.actionStatus = 'interview';
    mail.status = 'interview';
    await mail.save();

    // Create a new normal mail about interview scheduling
    await Mail.create({
      senderId: req.user.id,
      receiverId: mail.senderId,
      senderProfileName: req.user.fullName || req.user.name,
      receiverProfileName: mail.senderProfileName,
      senderRole: req.user.role,
      receiverRole: mail.senderRole,
      subject: `Interview Scheduling: Join our startup team`,
      body: `Hi ${mail.senderProfileName},\n\nWe have reviewed your application and would love to invite you for an interview. Please reply to this email with your availability over the next few days.\n\nBest,\n${req.user.fullName || req.user.name}`,
      type: 'normal',
      actionStatus: 'none',
      relatedStartupId: mail.relatedStartupId,
      isRead: false
    });

    await sendNotify(req, mail.senderId, 'mail_received', mail._id, 'Mail', `Interview invitation sent for application.`);

    res.status(200).json({ success: true, message: 'Application moved to interview stage. Notification email sent to applicant.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Mark request mail as invested
// @route   POST /api/mail/:id/mark-invested
// @access  Private
exports.markInvestedRequest = async (req, res) => {
  try {
    const { amount, equity } = req.body;
    const mail = await Mail.findById(req.params.id);
    if (!mail) {
      return res.status(404).json({ success: false, error: 'Mail not found' });
    }

    // Authorize: Only the investor or the founder involved in the deal can complete it.
    if (mail.senderId.toString() !== req.user.id && mail.receiverId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to manage this investment deal' });
    }

    // Find the investor startup connection
    let connection = await InvestorStartupConnection.findOne({
      startupId: mail.relatedStartupId,
      $or: [
        { investorId: mail.senderId },
        { investorId: mail.receiverId }
      ]
    });

    if (!connection) {
      // Look up using relatedConnectionId
      if (mail.relatedConnectionId) {
        connection = await InvestorStartupConnection.findById(mail.relatedConnectionId);
      }
    }

    if (!connection) {
      return res.status(404).json({ success: false, error: 'Investment connection details not found' });
    }

    connection.status = 'invested';
    connection.pipelineStage = 'Invested';
    connection.investmentAmount = Number(amount) || connection.investmentAmount || 0;
    connection.equityPercentage = Number(equity) || connection.equityPercentage || 0;
    connection.investedAt = new Date();
    await connection.save();

    mail.actionStatus = 'invested';
    mail.status = 'invested';
    await mail.save();

    const recipientId = req.user.id === connection.founderId.toString() ? connection.investorId : connection.founderId;

    await sendNotify(req, recipientId, 'investment_completed', connection._id, 'InvestorStartupConnection', `The deal is officially finalized! Startup marked as invested.`);

    res.status(200).json({ success: true, message: 'Deal officially marked as invested!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
