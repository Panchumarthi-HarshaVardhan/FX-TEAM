const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true
  }],
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Legacy / Backward compatibility fields
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  url: {
    type: String
  },
  cloudinaryId: {
    type: String
  },
  duration: {
    type: Number
  },
  format: {
    type: String
  },
  size: {
    type: Number
  },
  width: Number,
  height: Number,
  pitchAnalysis: {
    summary: { type: String },
    businessModel: { type: String },
    targetUsers: { type: String },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    suggestions: [{ type: String }],
    investorReadinessScore: { type: Number },
    createdAt: { type: Date, default: Date.now }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save hook to synchronize uploader <-> creator and url <-> videoUrl
videoSchema.pre('save', function(next) {
  if (!this.uploader && this.creator) {
    this.uploader = this.creator;
  }
  if (!this.creator && this.uploader) {
    this.creator = this.uploader;
  }
  if (!this.url && this.videoUrl) {
    this.url = this.videoUrl;
  }
  if (!this.videoUrl && this.url) {
    this.videoUrl = this.url;
  }
  next();
});

module.exports = require('../utils/firebaseModel').models.Video;
