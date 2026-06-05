const mongoose = require('mongoose');

const mailSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderProfileName: {
    type: String,
    default: ''
  },
  receiverProfileName: {
    type: String,
    default: ''
  },
  senderRole: {
    type: String,
    default: ''
  },
  receiverRole: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  body: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['normal', 'investment_request', 'application_request', 'cofounder_request', 'meeting_request', 'founder_update', 'system_update', 'status_update'],
    default: 'normal'
  },
  status: {
    type: String,
    default: 'pending'
  },
  actionStatus: {
    type: String,
    enum: ['none', 'pending', 'accepted', 'rejected', 'connected', 'interview', 'invested', 'withdrawn'],
    default: 'none'
  },
  relatedStartupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup'
  },
  relatedApplicationId: {
    type: mongoose.Schema.Types.ObjectId
  },
  relatedInvestmentRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestmentRequest'
  },
  relatedConnectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InvestorStartupConnection'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  isArchivedBySender: {
    type: Boolean,
    default: false
  },
  isArchivedByReceiver: {
    type: Boolean,
    default: false
  },
  isDeletedBySender: {
    type: Boolean,
    default: false
  },
  isDeletedByReceiver: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: String
  }]
}, {
  timestamps: true
});

// Create index for sender/receiver queries
mailSchema.index({ senderId: 1 });
mailSchema.index({ receiverId: 1 });
mailSchema.index({ type: 1 });

module.exports = require('../utils/firebaseModel').models.Mail;
