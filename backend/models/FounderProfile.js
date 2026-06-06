const mongoose = require('mongoose');

const founderProfileSchema = new mongoose.Schema({
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
  skills: [{
    type: String,
    trim: true
  }],
  experience: {
    type: mongoose.Schema.Types.Mixed,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  // Keep the below for compatibility with existing codebase features:
  startups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup'
  }],
  startupDescription: {
    type: String,
    maxlength: 1000
  },
  pitchDeckUrl: {
    type: String
  },
  pitchVideoUrl: {
    type: String
  },
  equityOffering: {
    type: Number,
    min: 0,
    max: 100
  },
  traction: {
    users: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    growthRate: { type: Number, default: 0 }
  },
  website: String,
  socialLinks: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  }
}, {
  timestamps: true
});

// Alias user to userId for backward compatibility
founderProfileSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

module.exports = require('../utils/firebaseModel').models.FounderProfile;
