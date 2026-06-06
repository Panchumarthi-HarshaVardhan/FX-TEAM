const mongoose = require('mongoose');

const jobSeekerProfileSchema = new mongoose.Schema({
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
  education: {
    type: mongoose.Schema.Types.Mixed,
    default: ''
  },
  experience: {
    type: mongoose.Schema.Types.Mixed,
    default: ''
  },
  resume: {
    type: String,
    default: ''
  },
  portfolioLink: {
    type: String,
    default: ''
  },
  github: {
    type: String,
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
  preferredJobType: {
    type: String,
    default: ''
  },
  expectedSalary: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = require('../utils/firebaseModel').models.JobSeekerProfile;
