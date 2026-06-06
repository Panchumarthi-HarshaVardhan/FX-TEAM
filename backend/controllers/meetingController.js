const Meeting = require('../models/Meeting');
const Mail = require('../models/Mail');
const User = require('../models/User');
const { mongooseCompat: mongoose } = require('../utils/firebaseModel');

// Generate random meeting code: abc-defg-hij
const generateMeetingCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const getGroup = (len) => Array.from({ length: len }).map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  return `${getGroup(3)}-${getGroup(4)}-${getGroup(3)}`;
};

// Create meeting
exports.createMeeting = async (req, res) => {
  try {
    const { title, agenda, participants = [], scheduledDate, startTime, endTime, startupId, requestId, mailThreadId } = req.body;
    
    // participants is an array of user IDs excluding host
    const participantObjects = participants.map(id => ({ userId: id, status: 'pending' }));
    
    const { v4: uuidv4 } = require('uuid');
    const roomId = uuidv4();
    const meetingCode = generateMeetingCode();
    const meetingLink = `/meet/${roomId}`;

    const newMeeting = new Meeting({
      roomId,
      title,
      agenda,
      hostId: req.user._id,
      participants: participantObjects,
      invitedUsers: participants,
      admittedUsers: [req.user._id],
      meetingCode,
      meetingLink,
      scheduledDate,
      startTime,
      endTime,
      startupId,
      requestId,
      mailThreadId
    });

    const savedMeeting = await newMeeting.save();

    // Send meeting invite mail to each participant
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const fullMeetingLink = `${frontendUrl}/meet/${meetingCode}`;
    for (const participantId of participants) {
      const inviteMail = new Mail({
        senderId: req.user._id,
        receiverId: participantId,
        subject: `Meeting Invite: ${title}`,
        body: `You have been invited to a meeting scheduled on ${new Date(scheduledDate).toLocaleDateString()} from ${startTime} to ${endTime}.\n\nAgenda: ${agenda}\n\nMeeting Code: ${meetingCode}\nJoin Meeting: ${fullMeetingLink}`,
        type: 'meeting_request',
        actionStatus: 'pending',
        relatedApplicationId: savedMeeting._id, // store meeting ID in relatedApplicationId
        meetingCode: meetingCode,
        meetingRoomId: roomId
      });
      await inviteMail.save();
    }

    console.log("Created meeting:", savedMeeting._id, savedMeeting.roomId, savedMeeting.meetingCode, savedMeeting.hostId);
    res.status(201).json({ success: true, meeting: savedMeeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get meetings for the logged in user
exports.getMeetings = async (req, res) => {
  try {
    const userId = req.user._id;
    const meetings = await Meeting.find({
      $or: [
        { hostId: userId },
        { 'participants.userId': userId }
      ]
    }).populate('hostId', 'name profileImage role').populate('participants.userId', 'name profileImage role').sort({ scheduledDate: 1, startTime: 1 });
    
    res.status(200).json({ success: true, data: meetings });
  } catch (error) {
    console.error('Error getting meetings:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Get meeting by roomId or meetingCode
exports.getMeetingByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id.toString();
    console.log(`[DEBUG] getMeetingByRoomId called for roomId: ${roomId} by user: ${userId}`);

    const meeting = await Meeting.findOne({
      $or: [
        { roomId }, 
        { meetingCode: roomId },
        { _id: mongoose.isValidObjectId(roomId) ? roomId : null }
      ]
    })
      .populate('hostId', 'name profileImage role')
      .populate('participants.userId', 'name profileImage role')
      .populate('chatMessages.senderId', 'name profileImage role');

    console.log(`[DEBUG] found meeting:`, meeting ? meeting._id : 'null');

    if (!meeting) {
      console.log(`[DEBUG] Returning 404 because meeting is null`);
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    // Authorization
    let isAuthorized = false;
    let accessStatus = 'granted';

    if (meeting.hostId._id.toString() === userId) {
      isAuthorized = true;
      accessStatus = 'granted';
    } else if (meeting.invitedUsers?.some(id => id.toString() === userId) || meeting.admittedUsers?.some(id => id.toString() === userId)) {
      isAuthorized = true;
    } else if (meeting.participants.some(p => p.userId && p.userId._id.toString() === userId && (p.status === 'accepted' || p.status === 'pending'))) {
      isAuthorized = true;
    } else if (meeting.rejectedUsers?.some(id => id.toString() === userId)) {
      return res.status(403).json({ success: false, error: 'Host denied your request' });
    }

    if (!isAuthorized) {
      accessStatus = 'waiting_room';
    }

    res.status(200).json({ success: true, data: meeting, accessStatus });
  } catch (error) {
    console.error('Error getting meeting details:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Respond to meeting invite
exports.respondToMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, mailId } = req.body; // status: 'accepted', 'rejected', 'tentative'
    const userId = req.user._id.toString();

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    const participant = meeting.participants.find(p => p.userId.toString() === userId);
    if (!participant) {
      return res.status(403).json({ success: false, error: 'You are not a participant' });
    }

    participant.status = status;
    await meeting.save();

    if (mailId) {
      const mail = await Mail.findById(mailId);
      if (mail) {
        mail.actionStatus = status;
        await mail.save();
      }
    }

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    console.error('Error responding to meeting:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// Cancel meeting
exports.cancelMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    if (meeting.hostId.toString() !== userId) {
      return res.status(403).json({ success: false, error: 'Only the host can cancel the meeting' });
    }

    meeting.status = 'cancelled';
    await meeting.save();

    // Send cancellation mail to participants
    for (const p of meeting.participants) {
      const cancelMail = new Mail({
        senderId: userId,
        receiverId: p.userId,
        subject: `Meeting Cancelled: ${meeting.title}`,
        body: `The meeting scheduled for ${new Date(meeting.scheduledDate).toLocaleDateString()} at ${meeting.startTime} has been cancelled.`,
        type: 'system_update'
      });
      await cancelMail.save();
    }

    res.status(200).json({ success: true, data: meeting });
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.saveChatMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ success: false, error: 'Meeting not found' });
    }

    meeting.chatMessages.push({ senderId: userId, text });
    await meeting.save();

    const populatedMeeting = await Meeting.findById(id).populate('chatMessages.senderId', 'name profileImage role');
    const newMsg = populatedMeeting.chatMessages[populatedMeeting.chatMessages.length - 1];

    res.status(201).json({ success: true, data: newMsg });
  } catch (error) {
    console.error('Error saving chat message:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
