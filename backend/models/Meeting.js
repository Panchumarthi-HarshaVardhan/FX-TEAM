const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const meetingChatMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const meetingParticipantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'tentative'],
    default: 'pending'
  }
});

const meetingSchema = new mongoose.Schema({
  roomId: {
    type: String,
    default: uuidv4,
    unique: true,
    required: true
  },
  meetingCode: {
    type: String,
    unique: true,
    required: true
  },
  meetingLink: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  agenda: {
    type: String,
    default: '',
    trim: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [meetingParticipantSchema],
  invitedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  waitingUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  admittedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  rejectedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup'
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId
  },
  mailThreadId: {
    type: String
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String, // format HH:MM
    required: true
  },
  endTime: {
    type: String, // format HH:MM
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  chatMessages: [meetingChatMessageSchema]
}, {
  timestamps: true
});

module.exports = mongoose.model('Meeting', meetingSchema);
