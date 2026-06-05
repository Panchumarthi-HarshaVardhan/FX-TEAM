const mongoose = require('mongoose');

const investmentRequestSchema = new mongoose.Schema({
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
    enum: ['pending', 'reviewed', 'accepted', 'declined', 'rejected', 'closed'],
    default: 'pending'
  },
  message: String,
  investmentRange: String,
  interestedAmount: {
    type: String,
    default: ''
  },
  investmentType: {
    type: String,
    enum: ['Equity', 'SAFE', 'Convertible Note', 'Debt', 'Other'],
    default: 'Equity'
  },
  requestPitchDeck: {
    type: Boolean,
    default: false
  },
  meetingRequest: {
    type: Boolean,
    default: false
  },
  attachmentUrl: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('InvestmentRequest', investmentRequestSchema);
