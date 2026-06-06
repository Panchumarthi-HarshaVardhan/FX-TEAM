const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobOpening',
    required: true
  },
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
  resume: {
    type: String,
    required: true
  },
  coverLetter: String,
  portfolioLink: String,
  github: String,
  linkedin: String,
  expectedSalary: String,
  availabilityDate: Date,
  reasonToJoin: String,
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'connected', 'accepted', 'rejected', 'hired', 'withdrawn'],
    default: 'pending'
  },
  reviewedAt: Date,
  connectedAt: Date,
  acceptedAt: Date,
  rejectedAt: Date,
  hiredAt: Date
}, {
  timestamps: true
});

// Ensure a user can only apply once to a specific job opening
jobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });

module.exports = require('../utils/firebaseModel').models.JobApplication;
