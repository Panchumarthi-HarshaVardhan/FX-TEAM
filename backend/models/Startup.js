const mongoose = require('mongoose');

const startupSchema = new mongoose.Schema({
  founderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  logo: {
    type: String,
    default: ''
  },
  oneLinePitch: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  industry: {
    type: String,
    required: true,
    default: 'Other'
  },
  stage: {
    type: String,
    required: true,
    enum: ['idea', 'mvp', 'first_customer', 'revenue', 'funded'],
    default: 'idea'
  },
  milestones: [{
    title: String,
    status: { 
      type: String, 
      enum: ['pending', 'completed'], 
      default: 'completed' 
    },
    date: { 
      type: Date, 
      default: Date.now 
    },
    description: String
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified', 'rejected'],
    default: 'unverified'
  },
  verificationProof: {
    type: String,
    trim: true
  },
  fundingRequired: {
    type: Number,
    min: 0,
    default: 0
  },
  fundingNeeded: {
    type: Number,
    min: 0,
    default: 0
  },
  minInvestment: {
    type: Number,
    min: 0,
    default: 0
  },
  equityOffered: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  pitchVideo: {
    type: String,
    default: ''
  },
  pitchDeck: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  socialLinks: {
    linkedin: String,
    twitter: String,
    github: String
  },
  location: {
    city: String,
    country: String,
    remote: {
      type: Boolean,
      default: false
    }
  },
  problem: {
    type: String,
    maxlength: 1000
  },
  problemStatement: {
    type: String,
    maxlength: 1000
  },
  solution: {
    type: String,
    maxlength: 1000
  },
  teamSize: {
    type: Number,
    default: 1
  },
  vision: {
    type: String,
    maxlength: 500
  },
  mission: {
    type: String,
    maxlength: 500
  },
  techStack: [{
    type: String,
    trim: true
  }],
  teamMembers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String, // Fallback if no user
    role: String,
    image: String,
    linkedin: String
  }],
  jobs: [{
    title: { type: String, required: true },
    type: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship'], required: true },
    location: { type: String, default: 'Remote' },
    salary: String,
    description: String,
    skills: [String],
    createdAt: { type: Date, default: Date.now }
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  saves: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  featured: {
    type: Boolean,
    default: false
  },
  featuredUntil: {
    type: Date
  },
  metrics: {
    views: {
      type: Number,
      default: 0
    },
    investorInterest: {
      type: Number,
      default: 0
    },
    profileVisits: {
      type: Number,
      default: 0
    },
    badgeViews: {
      type: Number,
      default: 0
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  is_public: {
    type: Boolean,
    default: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  contactEmail: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Virtual for total followers count
startupSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Method to check if user is founder
startupSchema.methods.isFounder = function(userId) {
  return this.founderId.toString() === userId.toString();
};

// Method to check if user is team member
startupSchema.methods.isTeamMember = function(userId) {
  return this.teamMembers.some(member => 
    member.userId.toString() === userId.toString()
  ) || this.isFounder(userId);
};

// Method to add investor interest
startupSchema.methods.addInvestorInterest = function() {
  this.metrics.investorInterest += 1;
  return this.save();
};

// Method to increment views
startupSchema.methods.incrementViews = function() {
  this.metrics.views += 1;
  return this.save();
};

// Method to increment profile visits
startupSchema.methods.incrementProfileVisits = function() {
  this.metrics.profileVisits += 1;
  return this.save();
};

// Get public startup data
startupSchema.methods.toPublicJSON = function(currentUser = null) {
  const data = {
    _id: this._id,
    founderId: this.founderId,
    name: this.name,
    logo: this.logo,
    oneLinePitch: this.oneLinePitch,
    description: this.description,
    industry: this.industry,
    stage: this.stage,
    fundingRequired: this.fundingRequired,
    equityOffered: this.equityOffered,
    pitchVideo: this.pitchVideo,
    website: this.website,
    techStack: this.techStack,
    teamMembers: this.teamMembers,
    followerCount: this.followerCount,
    teamSize: this.teamSize,
    verified: this.verified,
    featured: this.featured,
    metrics: this.metrics,
    tags: this.tags,
    location: this.location,
    createdAt: this.createdAt
  };

  if (currentUser) {
    data.isSavedBy = this.isSavedBy(currentUser._id);
  }

  return data;
};

// Indexes for performance
startupSchema.index({ founderId: 1 });
startupSchema.index({ industry: 1 });
startupSchema.index({ stage: 1 });
startupSchema.index({ verified: 1 });
startupSchema.index({ featured: 1 });
startupSchema.index({ 'metrics.views': -1 });
startupSchema.index({ 'metrics.investorInterest': -1 });
startupSchema.index({ tags: 1 });

startupSchema.methods.isSavedBy = function(userId) {
  if (!userId) return false;
  return this.saves.some(save => save.userId.toString() === userId.toString());
};

// Generate slug from name
startupSchema.pre('save', async function(next) {
  if (!this.isModified('name')) return next();

  let slug = this.name
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word chars with -
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing -
  
  // Check for uniqueness
  const existingStartup = await mongoose.models.Startup.findOne({ slug });
  if (existingStartup && existingStartup._id.toString() !== this._id.toString()) {
    // If slug exists, append a random string
    slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
  }
  
  this.slug = slug;
  next();
});

module.exports = mongoose.model('Startup', startupSchema);
