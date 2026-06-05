const mongoose = require('mongoose');

const teamInvitationSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['co-founder', 'team-member'],
    default: 'co-founder'
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Avoid duplicate pending invitations for same recipient to same startup
teamInvitationSchema.index({ startupId: 1, recipientId: 1, status: 1 }, { 
  unique: true, 
  partialFilterExpression: { status: 'pending' } 
});

module.exports = require('../utils/firebaseModel').models.TeamInvitation;
