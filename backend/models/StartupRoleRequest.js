const mongoose = require('mongoose');

const startupRoleRequestSchema = new mongoose.Schema({
  startupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup',
    required: true
  },
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestType: {
    type: String,
    enum: ['Internship', 'Job', 'Co-founder', 'Team Member', 'Custom'],
    required: true
  },
  roleTitle: {
    type: String,
    required: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  resume: {
    type: String,
    required: true
  },
  portfolioLink: String,
  github: String,
  linkedin: String,
  message: String,
  availabilityDate: Date,
  expectedSalary: String,
  reasonToJoin: String,
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'connected', 'accepted', 'rejected', 'hired', 'withdrawn'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = require('../utils/firebaseModel').models.StartupRoleRequest;
