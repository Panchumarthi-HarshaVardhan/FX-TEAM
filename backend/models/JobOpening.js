const mongoose = require('mongoose');

const jobOpeningSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  roleType: {
    type: String,
    enum: ['Internship', 'Full-time', 'Part-time', 'Co-founder', 'Volunteer'],
    required: true
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  experienceLevel: String,
  workMode: {
    type: String,
    enum: ['Remote', 'On-site', 'Hybrid'],
    required: true
  },
  location: String,
  salaryMin: String,
  salaryMax: String,
  duration: String,
  openings: {
    type: Number,
    default: 1
  },
  deadline: Date,
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true
});

module.exports = require('../utils/firebaseModel').models.JobOpening;
