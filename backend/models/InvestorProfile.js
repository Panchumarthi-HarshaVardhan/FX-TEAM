const mongoose = require('mongoose');

const investorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  investorType: {
    type: String,
    enum: ['Angel', 'VC', 'Accelerator', 'Family Office', 'Corporate', 'Other'],
    default: 'Angel'
  },
  investmentMin: {
    type: Number,
    default: 0
  },
  investmentMax: {
    type: Number,
    default: 0
  },
  preferredIndustries: [{
    type: String
  }],
  location: {
    type: String,
    default: ''
  },
  portfolioCompanies: [{
    type: String
  }],
  linkedin: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  // Keep the below for compatibility with existing watchlist / dashboard features:
  ticketSize: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  preferredStages: [{
    type: String
  }],
  portfolio: [{
    name: String,
    website: String,
    logo: String
  }],
  activelyInvesting: {
    type: Boolean,
    default: true
  },
  open_to_invest: {
    type: Boolean,
    default: true
  },
  investor_type: {
    type: String
  },
  investment_focus: {
    type: String
  },
  preferred_industries: [{
    type: String
  }],
  ticket_size_min: {
    type: Number,
    default: 0
  },
  ticket_size_max: {
    type: Number,
    default: 0
  },
  portfolio_count: {
    type: Number,
    default: 0
  },
  verified_investor: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Alias user to userId for backward compatibility
investorProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

module.exports = require('../utils/firebaseModel').models.InvestorProfile;
