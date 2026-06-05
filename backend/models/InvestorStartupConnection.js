const mongoose = require('mongoose');

const investorStartupConnectionSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['connected', 'invested', 'rejected'],
    default: 'connected'
  },
  pipelineStage: {
    type: String,
    enum: [
      'Discovered',
      'Interested',
      'Request Sent',
      'Connected',
      'Meeting',
      'Due Diligence',
      'Negotiation',
      'Invested',
      'Rejected'
    ],
    default: 'Connected'
  },
  investmentAmount: {
    type: Number,
    default: 0
  },
  equityPercentage: {
    type: Number,
    default: 0
  },
  privateNotes: {
    type: String,
    default: ''
  },
  meetingNotes: {
    type: String,
    default: ''
  },
  sharedLinks: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  investedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Ensure compound unique constraint to prevent duplicate connections
investorStartupConnectionSchema.index({ startupId: 1, investorId: 1 }, { unique: true });

module.exports = mongoose.model('InvestorStartupConnection', investorStartupConnectionSchema);
