const mongoose = require('mongoose');

const investorInterestSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true
  },
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  investorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'closed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Enforce unique constraints to prevent duplicate investor interest submissions
investorInterestSchema.index({ videoId: 1, investorId: 1 }, { unique: true });

module.exports = require('../utils/firebaseModel').models.InvestorInterest;
