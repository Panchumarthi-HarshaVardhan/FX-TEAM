const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  name: {
    type: String,
    trim: true,
    maxlength: 100
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: function() {
      return !this.googleId && !this.linkedinId;
    }
  },
  role: {
    type: String,
    enum: ['user', 'founder', 'investor', 'admin'],
    default: 'founder'
  },
  profileImage: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  about: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  story: {
    type: String,
    maxlength: 2000,
    default: ''
  },
  interests: [{
    type: String,
    trim: true
  }],
  profileCompleted: {
    type: Boolean,
    default: false
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  tagline: {
    type: String,
    maxlength: 100,
    trim: true
  },
  headline: {
    type: String,
    maxlength: 100,
    trim: true
  },
  vision: {
    type: String,
    maxlength: 500,
    trim: true
  },
  experience: [{
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: Boolean,
    description: String,
    type: {
      type: String,
      enum: ['work', 'education', 'project'],
      default: 'work'
    }
  }],
  currentRole: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  experienceLevel: {
    type: String,
    trim: true
  },
  tools: [{
    type: String,
    trim: true
  }],
  lookingFor: [{
    type: String,
    trim: true
  }],
  lookingForDescription: {
    type: String,
    maxlength: 500
  },
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'connections'],
      default: 'public'
    },
    messagePermission: {
      type: String,
      enum: ['everyone', 'connections', 'none'],
      default: 'everyone'
    },
    showInvestmentInterests: {
      type: Boolean,
      default: true
    }
  },
  notificationPreferences: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    newFollower: { type: Boolean, default: true },
    newMessage: { type: Boolean, default: true },
    investorInterest: { type: Boolean, default: true },
    startupUpdates: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: false },
    marketingEmails: { type: Boolean, default: false }
  },
  skills: [{
    type: String,
    trim: true
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  savedStartups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Startup'
  }],
  pinnedPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  profileViews: [{
    viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  linkedinId: {
    type: String,
    unique: true,
    sparse: true
  },
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
    type: String, // URL to proof (LinkedIn, Document, etc.)
    trim: true
  },
  verificationType: {
    type: String,
    enum: ['linkedin', 'domain_email', 'document'],
    default: 'linkedin'
  },
  // --- New Verification Fields ---
  isEmailVerified: {
    type: Boolean,
    default: true
  },
  emailVerifiedAt: Date,
  emailVerificationOtp: String,
  emailVerificationExpires: Date,
  loginOtp: String,
  loginOtpExpires: Date,
  googleVerified: {
    type: Boolean,
    default: false
  },
  founderVerificationData: {
    documentUrl: String, // Aadhaar or Passport
    panCardUrl: String,
    linkedinUrl: String
  },
  investorVerificationData: {
    panCardUrl: String,
    linkedinUrl: String,
    companyWebsite: String,
    investmentProofUrl: String
  },
  founderVerificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'approved', 'rejected'],
    default: 'unverified'
  },
  investorVerificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'approved', 'rejected'],
    default: 'unverified'
  },
  adminVerificationNotes: {
    type: String,
    default: ''
  },
  // -------------------------------
  founderScore: {
    type: Number,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  verificationBadge: {
    type: String,
    enum: ['founder', 'investor', 'none'],
    default: 'none'
  },
  socialLinks: {
    linkedin: String,
    twitter: String,
    website: String,
    github: String,
    email: String
  },
  location: {
    country: String,
    city: String
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals for role profiles
userSchema.virtual('founderProfile', {
  ref: 'FounderProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

userSchema.virtual('investorProfile', {
  ref: 'InvestorProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

userSchema.virtual('jobSeekerProfile', {
  ref: 'JobSeekerProfile',
  localField: '_id',
  foreignField: 'userId',
  justOne: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  const hash = this.passwordHash || this._doc.password;
  if (!hash) return false;
  return bcrypt.compare(candidatePassword, hash);
};

// Get public profile data
userSchema.methods.toPublicJSON = function() {
  const data = {
    _id: this._id,
    fullName: this.fullName,
    name: this.fullName || this.name,
    username: this.username,
    email: this.email,
    role: this.role,
    profileImage: this.profileImage,
    coverImage: this.coverImage,
    bio: this.bio,
    headline: this.headline,
    about: this.about,
    currentRole: this.currentRole,
    industry: this.industry,
    experienceLevel: this.experienceLevel,
    tools: this.tools,
    lookingFor: this.lookingFor,
    lookingForDescription: this.lookingForDescription,
    privacySettings: this.privacySettings,
    skills: this.skills,
    followers: this.followers,
    following: this.following,
    isVerified: this.isVerified,
    isEmailVerified: this.isEmailVerified,
    googleVerified: this.googleVerified,
    founderVerificationStatus: this.founderVerificationStatus,
    investorVerificationStatus: this.investorVerificationStatus,
    founderVerificationData: this.founderVerificationData,
    investorVerificationData: this.investorVerificationData,
    verificationBadge: this.verificationBadge,
    founderScore: this.founderScore || 0,
    trustScore: this.trustScore,
    socialLinks: this.socialLinks,
    location: this.location,
    subscriptionPlan: this.subscriptionPlan,
    story: this.story,
    interests: this.interests,
    profileCompleted: this.profileCompleted,
    isProfileComplete: this.profileCompleted || this.isProfileComplete,
    createdAt: this.createdAt
  };

  if (this.role === 'founder' && this.founderProfile) {
    data.roleProfile = this.founderProfile;
  } else if (this.role === 'investor' && this.investorProfile) {
    data.roleProfile = this.investorProfile;
  } else if (this.role === 'user' && this.jobSeekerProfile) {
    data.roleProfile = this.jobSeekerProfile;
  }

  return data;
};

// Trust Score calculation
userSchema.virtual('trustScore').get(function() {
  let score = 0;
  if (this.isEmailVerified) score += 30;
  if (this.googleVerified || this.googleId) score += 10;
  if (this.profileCompleted || this.isProfileComplete) score += 20;
  
  if (this.role === 'founder' && this.founderVerificationStatus === 'approved') {
    score += 40;
  } else if (this.role === 'investor' && this.investorVerificationStatus === 'approved') {
    score += 40;
  } else if (this.role === 'job_seeker' && this.verificationStatus === 'verified') {
    score += 40;
  }

  return score;
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'skills': 1 });
userSchema.index({ 'location.country': 1 });

module.exports = require('../utils/firebaseModel').models.User;
