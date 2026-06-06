const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const MessageRequest = require('../models/MessageRequest');
const User = require('../models/User');
const { createNotification } = require('../utils/socialHelpers');

// @desc    Send a message (start or continue conversation)
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content, type = 'text', mediaUrl, replyTo } = req.body;
    const senderId = req.user.id;

    if (!recipientId || (!content && !mediaUrl)) {
      return res.status(400).json({ success: false, error: 'Recipient and content/media are required' });
    }

    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      return res.status(404).json({ success: false, error: 'Recipient user not found' });
    }

    if (recipientUser.blockedUsers && recipientUser.blockedUsers.includes(senderId)) {
      return res.status(403).json({ success: false, error: 'You have been blocked by this user' });
    }

    // Connection Check: Mutual follow, shared startup team, or accepted investment request
    const senderUser = await User.findById(senderId);
    const isMutualFollow = senderUser.following.includes(recipientId) && recipientUser.following.includes(senderId);

    const Startup = require('../models/Startup');
    const sharedStartup = await Startup.findOne({
      $or: [
        { founderId: senderId, 'teamMembers.userId': recipientId },
        { founderId: recipientId, 'teamMembers.userId': senderId },
        { 'teamMembers.userId': { $all: [senderId, recipientId] } }
      ]
    });

    const InvestmentRequest = require('../models/InvestmentRequest');
    const hasAcceptedInvestmentRequest = await InvestmentRequest.findOne({
      status: 'accepted',
      $or: [
        { investorId: senderId, founderId: recipientId },
        { investorId: recipientId, founderId: senderId }
      ]
    });

    const Application = require('../models/Application');
    let hasAcceptedJobApplication = await Application.findOne({
      status: { $in: ['connected', 'accepted', 'hired'] },
      $or: [
        { applicantId: senderId, startupId: { $in: await Startup.find({ founderId: recipientId }).distinct('_id') } },
        { applicantId: recipientId, startupId: { $in: await Startup.find({ founderId: senderId }).distinct('_id') } }
      ]
    });

    if (!hasAcceptedJobApplication) {
      const JobApplication = require('../models/JobApplication');
      hasAcceptedJobApplication = await JobApplication.findOne({
        status: { $in: ['connected', 'accepted', 'hired'] },
        $or: [
          { applicantId: senderId, startupId: { $in: await Startup.find({ founderId: recipientId }).distinct('_id') } },
          { applicantId: recipientId, startupId: { $in: await Startup.find({ founderId: senderId }).distinct('_id') } }
        ]
      });
    }

    if (!hasAcceptedJobApplication) {
      const StartupRoleRequest = require('../models/StartupRoleRequest');
      hasAcceptedJobApplication = await StartupRoleRequest.findOne({
        status: { $in: ['connected', 'accepted', 'hired'] },
        $or: [
          { applicantId: senderId, startupId: { $in: await Startup.find({ founderId: recipientId }).distinct('_id') } },
          { applicantId: recipientId, startupId: { $in: await Startup.find({ founderId: senderId }).distinct('_id') } }
        ]
      });
    }

    if (!isMutualFollow && !sharedStartup && !hasAcceptedInvestmentRequest && !hasAcceptedJobApplication) {
      return res.status(400).json({
        success: false,
        error: 'You must follow each other, be in the same startup team, have an accepted investment request, or have an accepted job application to start chatting.'
      });
    }

    // 1. Check for existing Conversation

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] }
    });

    // If conversation exists, add message to it
    if (conversation) {
      if (conversation.status === 'blocked') {
        return res.status(403).json({ success: false, error: 'Cannot send message to this user' });
      }
      
      if (conversation.status === 'declined') {
         // Check who declined? For now, if declined, it's blocked.
         return res.status(403).json({ success: false, error: 'Message request was declined' });
      }

      // If pending and I am NOT initiator, my reply auto-accepts
      if (conversation.status === 'pending' && conversation.initiator.toString() !== req.user.id) {
        conversation.status = 'accepted';
      }

      const message = await Message.create({
        conversationId: conversation._id,
        sender: req.user.id,
        content: content || (type === 'image' ? 'Sent an image' : 'Sent a file'),
        type,
        mediaUrl,
        replyTo,
        readBy: [req.user.id]
      });

      conversation.lastMessage = message._id;
      const currentUnread = conversation.unreadCount.get(recipientId.toString()) || 0;
      conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);
      await conversation.save();

      // Emit socket event
      const io = req.app.get('io');
      if (io) {
        io.to(recipientId).emit('receive_message', await message.populate('sender', 'name profileImage'));
      }

      await message.populate('sender', 'name profileImage');
      if (replyTo) {
        await message.populate({
          path: 'replyTo',
          populate: { path: 'sender', select: 'name' }
        });
      }

      return res.status(201).json({
        success: true,
        data: message,
        conversationStatus: conversation.status
      });
    }

    // 2. No Conversation -> Check for Pending Request
    // Check if I already sent a request
    let existingRequest = await MessageRequest.findOne({
      sender: req.user.id,
      receiver: recipientId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ success: false, error: 'Message request already pending' });
    }

    // Check if THEY sent ME a request (Auto-Accept scenario)
    let incomingRequest = await MessageRequest.findOne({
      sender: recipientId,
      receiver: req.user.id,
      status: 'pending'
    });

    if (incomingRequest) {
      // Accept their request and create conversation
      incomingRequest.status = 'accepted';
      await incomingRequest.save();

      conversation = await Conversation.create({
        participants: [recipientId, req.user.id],
        initiator: recipientId, // They started it
        status: 'accepted'
      });

      // Move their initial message
      if (incomingRequest.initialMessage) {
         await Message.create({
             conversationId: conversation._id,
             sender: recipientId,
             content: incomingRequest.initialMessage,
             readBy: [req.user.id]
         });
      }

      // Add MY new message
      const message = await Message.create({
        conversationId: conversation._id,
        sender: req.user.id,
        content: content || 'Accepted request',
        type,
        mediaUrl,
        readBy: [req.user.id]
      });

      conversation.lastMessage = message._id;
      await conversation.save();

      // Notify them of acceptance + new message
      await createNotification({
        recipient: recipientId,
        sender: req.user.id,
        type: 'request_accepted',
        entityId: conversation._id,
        entityType: 'User'
      }, req.app.get('io'));

      return res.status(201).json({
        success: true,
        data: await message.populate('sender', 'name profileImage'),
        conversationStatus: 'accepted'
      });
    }

    // 3. Create New Message Request
    const newRequest = await MessageRequest.create({
      sender: req.user.id,
      receiver: recipientId,
      status: 'pending',
      initialMessage: content
    });

    // Notify recipient
    await createNotification({
        recipient: recipientId,
        sender: req.user.id,
        type: 'message_request',
        entityId: newRequest._id,
        entityType: 'User',
        content: content ? content.substring(0, 50) : 'Sent a message request'
    }, req.app.get('io'));
    
    // Emit socket event to recipient for real-time update
    const io = req.app.get('io');
    if (io) {
        io.to(recipientId).emit('new_message_request');
    }

    // Return a "fake" message object so frontend doesn't break
    // Frontend expects `data` to be the message
    const fakeMessage = {
      _id: newRequest._id, // Use request ID temporarily
      conversationId: 'pending_' + newRequest._id,
      sender: { 
          _id: req.user.id, 
          name: req.user.name, 
          profileImage: req.user.profileImage 
      },
      content: content,
      createdAt: newRequest.createdAt,
      isRequest: true
    };

    res.status(201).json({
      success: true,
      data: fakeMessage,
      conversationStatus: 'pending'
    });

  } catch (error) {
    console.error('ERROR SENDING MESSAGE:', error);
    res.status(500).json({ success: false, error: error.message || 'Server Error' });
  }
};

// @desc    Accept message request
// @route   PUT /api/messages/:id/accept
// @access  Private
exports.acceptRequest = async (req, res) => {
  try {
    const requestId = req.params.id;

    // Try finding MessageRequest
    const request = await MessageRequest.findById(requestId);

    if (request) {
        if (request.receiver.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Request already processed' });
        }

        request.status = 'accepted';
        await request.save();

        // Check if conversation already exists (race condition)
        let conversation = await Conversation.findOne({
            participants: { $all: [request.sender, request.receiver] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [request.sender, request.receiver],
                initiator: request.sender,
                status: 'accepted',
                unreadCount: { [req.user.id]: 0, [request.sender]: 0 }
            });

            // Create initial message
            if (request.initialMessage) {
                const msg = await Message.create({
                    conversationId: conversation._id,
                    sender: request.sender,
                    content: request.initialMessage,
                    readBy: [req.user.id]
                });
                conversation.lastMessage = msg._id;
                await conversation.save();
            }
        }

        // Notify sender
        await createNotification({
            recipient: request.sender,
            sender: req.user.id,
            type: 'request_accepted',
            entityId: conversation._id,
            entityType: 'User'
        }, req.app.get('io'));

        // Emit socket event to update UI real-time
        const io = req.app.get('io');
        if (io) {
            io.to(request.sender.toString()).emit('request_accepted', { conversationId: conversation._id });
        }

        return res.status(200).json({ success: true, data: conversation });
    }

    // Fallback: Check Conversation (legacy support)
    const conversation = await Conversation.findById(requestId);
    if (conversation) {
        if (!conversation.participants.includes(req.user.id)) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        conversation.status = 'accepted';
        await conversation.save();
        return res.status(200).json({ success: true, data: conversation });
    }

    return res.status(404).json({ success: false, error: 'Request not found' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Decline message request
// @route   PUT /api/messages/:id/decline
// @access  Private
exports.declineRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const request = await MessageRequest.findById(requestId);

    if (request) {
        if (request.receiver.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        request.status = 'declined';
        await request.save();
        return res.status(200).json({ success: true, data: request });
    }

    // Fallback
    const conversation = await Conversation.findById(requestId);
    if (conversation) {
        if (!conversation.participants.includes(req.user.id)) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        conversation.status = 'declined';
        await conversation.save();
        return res.status(200).json({ success: true, data: conversation });
    }

    return res.status(404).json({ success: false, error: 'Request not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all conversations and requests
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    console.log('[DEBUG] getConversations called by user:', req.user.id);
    const { status } = req.query;

    // 1. Get Active Conversations
    let convQuery = { participants: req.user.id };
    if (status === 'accepted') {
        convQuery.status = 'accepted';
    } else if (status === 'pending') {
        convQuery.status = 'pending';
    } else {
        convQuery.status = { $in: ['accepted', 'pending'] }; 
    }

    const conversations = await Conversation.find(convQuery)
      .populate('participants', 'name username profileImage role')
      .populate('lastMessage', 'content sender createdAt type isRead')
      .lean();

    // 2. Get Message Requests
    const requests = await MessageRequest.find({
        $or: [
            { receiver: req.user.id, status: 'pending' },
            { sender: req.user.id, status: 'pending' }
        ]
    })
    .populate('sender', 'name username profileImage role')
    .populate('receiver', 'name username profileImage role')
    .lean();
    
    console.log('[DEBUG] Found requests:', requests.length);

    // 3. Map Requests to Conversation structure
    const requestConvs = requests.map((reqDoc, idx) => {
        const isIncoming = reqDoc.receiver._id.toString() === req.user.id;
        console.log(`[DEBUG] Request ${idx}:`, { sender: reqDoc.sender._id, receiver: reqDoc.receiver._id, isIncoming });
        return {
            _id: reqDoc._id, // Use request ID as conversation ID for frontend
            participants: [reqDoc.sender, reqDoc.receiver],
            initiator: reqDoc.sender._id,
            status: 'pending',
            lastMessage: {
                content: reqDoc.initialMessage || 'Sent a request',
                sender: reqDoc.sender._id,
                createdAt: reqDoc.createdAt,
                type: 'text',
                isRead: false
            },
            unreadCount: isIncoming ? { [req.user.id]: 1 } : {},
            updatedAt: reqDoc.createdAt,
            isRequest: true
        };
    });

    // 4. Merge and Deduplicate by other participant's User ID
    const merged = [...conversations, ...requestConvs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    const uniqueMap = new Map();
    for (const c of merged) {
      if (!c.participants || c.participants.length === 0) continue;
      
      const otherUser = c.participants.find(p => p && p._id && p._id.toString() !== req.user.id);
      if (!otherUser) continue;
      
      const otherUserId = otherUser._id.toString();
      if (!uniqueMap.has(otherUserId)) {
        uniqueMap.set(otherUserId, c);
      }
    }
    
    const all = Array.from(uniqueMap.values());

    res.status(200).json({
      success: true,
      count: all.length,
      data: all
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    // 1. Validate participation first
    // Check if it looks like a Mongo ID (Conversation)
    const isMongoId = req.params.conversationId.match(/^[0-9a-fA-F]{24}$/);
    
    if (isMongoId) {
        const conversation = await Conversation.findById(req.params.conversationId);
        // If conversation exists, verify participation
        if (conversation) {
            const isParticipant = conversation.participants.some(p => p.toString() === req.user.id);
            if (!isParticipant) {
                return res.status(403).json({ success: false, error: 'Not authorized to view this conversation' });
            }
        }
        // If not found, it might be a pending request ID from our frontend mapping, 
        // or actually not found. We proceed to check Message/Request.
    }

    // 2. Fetch Messages
    // If it's a request ID (from our mapped objects), we return the initial message
    // How to distinguish? MongoDB IDs are random.
    // Try finding messages with this conversation ID.
    const messages = await Message.find({
      conversationId: req.params.conversationId
    })
    .populate('sender', 'name profileImage')
    .populate({
      path: 'replyTo',
      populate: { path: 'sender', select: 'name' }
    })
    .sort({ createdAt: 1 });

    if (messages.length === 0) {
        // Check if it's a request
        // Verify participation in request as well
        const request = await MessageRequest.findById(req.params.conversationId).populate('sender', 'name profileImage');
        if (request) {
             if (request.sender._id.toString() !== req.user.id && request.receiver.toString() !== req.user.id) {
                return res.status(403).json({ success: false, error: 'Not authorized' });
             }

            // Return initial message as a message object
            return res.status(200).json({
                success: true,
                count: 1,
                data: [{
                    _id: 'init_' + request._id,
                    conversationId: request._id,
                    sender: request.sender,
                    content: request.initialMessage || 'Sent a request',
                    createdAt: request.createdAt,
                    type: 'text',
                    readBy: []
                }]
            });
        }
    }

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Mark conversation as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markRead = async (req, res) => {
    try {
        const conversation = await Conversation.findById(req.params.id);
        
        // If not found, it might be a request, ignore or handle?
        // Requests don't strictly have 'read' status in same way.
        if (!conversation) return res.status(200).json({success: true}); // Silent success

        // Reset unread count for me
        if (conversation.unreadCount) {
             conversation.unreadCount.set(req.user.id.toString(), 0);
             await conversation.save();
        }

        await Message.updateMany(
            { conversationId: conversation._id, readBy: { $ne: req.user.id } },
            { $addToSet: { readBy: req.user.id } }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    React to a message
// @route   POST /api/messages/message/:id/react
// @access  Private
exports.reactToMessage = async (req, res) => {
    try {
        const { emoji } = req.body;
        const message = await Message.findById(req.params.id);
        
        if (!message) return res.status(404).json({success: false});

        // Check if I already reacted
        const existing = message.reactions.find(r => r.user.toString() === req.user.id);
        if (existing) {
            if (existing.emoji === emoji) {
                message.reactions = message.reactions.filter(r => r.user.toString() !== req.user.id);
            } else {
                existing.emoji = emoji;
            }
        } else {
            message.reactions.push({ user: req.user.id, emoji });
        }

        await message.save();
        
        // Emit reaction update
        const io = req.app.get('io');
        if (io) {
            // Find other participant to notify? Or just broadcast to conversation room if we had one.
            // Since we don't have conversation ID easily here without populating or querying, 
            // we'll assume the frontend handles it or we query conversation.
            // Better: emit to conversation participants.
            const conversation = await Conversation.findById(message.conversationId);
            if (conversation) {
                 conversation.participants.forEach(p => {
                     if (p.toString() !== req.user.id) {
                         io.to(p.toString()).emit('message_reaction', { messageId: message._id, reactions: message.reactions });
                     }
                 });
            }
        }

        res.status(200).json({ success: true, data: message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Edit a message
// @route   PUT /api/messages/message/:id
// @access  Private
exports.editMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const message = await Message.findById(req.params.id);

        if (!message) return res.status(404).json({ success: false, error: 'Message not found' });

        if (message.sender.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }

        // 15 minute edit window limit (optional, but good practice)
        const editWindow = 15 * 60 * 1000;
        if (Date.now() - new Date(message.createdAt).getTime() > editWindow) {
             return res.status(400).json({ success: false, error: 'Edit window expired' });
        }

        message.content = content;
        message.isEdited = true;
        await message.save();

        // Emit update
        const io = req.app.get('io');
        if (io) {
             const conversation = await Conversation.findById(message.conversationId);
             if (conversation) {
                 conversation.participants.forEach(p => {
                     if (p.toString() !== req.user.id) {
                         io.to(p.toString()).emit('message_updated', { 
                             messageId: message._id, 
                             content, 
                             isEdited: true 
                         });
                     }
                 });
             }
        }

        res.status(200).json({ success: true, data: message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Delete a message
// @route   DELETE /api/messages/message/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
    try {
        const { deleteForEveryone } = req.query; // ?deleteForEveryone=true
        const message = await Message.findById(req.params.id);

        if (!message) return res.status(404).json({ success: false, error: 'Message not found' });

        const isSender = message.sender.toString() === req.user.id;

        if (deleteForEveryone === 'true') {
            if (!isSender) {
                return res.status(403).json({ success: false, error: 'Only sender can delete for everyone' });
            }
            
            // 1 hour delete window?
            // message.content = 'This message was deleted';
            // message.type = 'system';
            // Or actually delete? WhatsApp replaces content.
            message.content = 'This message was deleted';
            message.type = 'system'; // Or 'deleted'
            message.isDeleted = true; // Maybe add this field schema if strictly needed, or just rely on content
            // Let's use specific content marker
            await message.save();

            const io = req.app.get('io');
            if (io) {
                 const conversation = await Conversation.findById(message.conversationId);
                 if (conversation) {
                     conversation.participants.forEach(p => {
                         io.to(p.toString()).emit('message_deleted', { messageId: message._id });
                     });
                 }
            }
        } else {
            // Delete for me only (add to deletedFor array)
            if (!message.deletedFor.includes(req.user.id)) {
                message.deletedFor.push(req.user.id);
                await message.save();
            }
        }

        res.status(200).json({ success: true, data: message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Check if chat is authorized with user
// @route   GET /api/messages/can-chat/:userId
// @access  Private
exports.checkCanChat = async (req, res) => {
  try {
    const recipientId = req.params.userId;
    const senderId = req.user.id;

    if (recipientId === senderId) {
      return res.status(200).json({ success: true, canChat: false });
    }

    const recipientUser = await User.findById(recipientId);
    if (!recipientUser) {
      return res.status(204).json({ success: true, canChat: false }); // Safe default if user doesn't exist
    }

    const senderUser = await User.findById(senderId);

    // 1. Check mutual follow
    const isMutualFollow = senderUser.following.includes(recipientId) && recipientUser.following.includes(senderId);

    // 2. Check shared startup team
    const Startup = require('../models/Startup');
    const sharedStartup = await Startup.findOne({
      $or: [
        { founderId: senderId, 'teamMembers.userId': recipientId },
        { founderId: recipientId, 'teamMembers.userId': senderId },
        { 'teamMembers.userId': { $all: [senderId, recipientId] } }
      ]
    });

    // 3. Check accepted investment request
    const InvestmentRequest = require('../models/InvestmentRequest');
    const hasAcceptedInvestmentRequest = await InvestmentRequest.findOne({
      status: 'accepted',
      $or: [
        { investorId: senderId, founderId: recipientId },
        { investorId: recipientId, founderId: senderId }
      ]
    });

    // 4. Check accepted job application
    const Application = require('../models/Application');
    let hasAcceptedJobApplication = await Application.findOne({
      status: { $in: ['connected', 'accepted', 'hired'] },
      $or: [
        { applicantId: senderId, startupId: { $in: await Startup.find({ founderId: recipientId }).distinct('_id') } },
        { applicantId: recipientId, startupId: { $in: await Startup.find({ founderId: senderId }).distinct('_id') } }
      ]
    });

    if (!hasAcceptedJobApplication) {
      const JobApplication = require('../models/JobApplication');
      hasAcceptedJobApplication = await JobApplication.findOne({
        status: { $in: ['connected', 'accepted', 'hired'] },
        $or: [
          { applicantId: senderId, startupId: { $in: await Startup.find({ founderId: recipientId }).distinct('_id') } },
          { applicantId: recipientId, startupId: { $in: await Startup.find({ founderId: senderId }).distinct('_id') } }
        ]
      });
    }

    if (!hasAcceptedJobApplication) {
      const StartupRoleRequest = require('../models/StartupRoleRequest');
      hasAcceptedJobApplication = await StartupRoleRequest.findOne({
        status: { $in: ['connected', 'accepted', 'hired'] },
        $or: [
          { applicantId: senderId, startupId: { $in: await Startup.find({ founderId: recipientId }).distinct('_id') } },
          { applicantId: recipientId, startupId: { $in: await Startup.find({ founderId: senderId }).distinct('_id') } }
        ]
      });
    }

    const canChat = !!(isMutualFollow || sharedStartup || hasAcceptedInvestmentRequest || hasAcceptedJobApplication);

    res.status(200).json({
      success: true,
      canChat
    });
  } catch (error) {
    console.error('Error checking can-chat status:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
