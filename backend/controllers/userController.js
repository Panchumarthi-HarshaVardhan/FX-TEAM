const { mongooseCompat: mongoose } = require('../utils/firebaseModel');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const calculateFounderScore = require('../utils/calculateFounderScore');
const { createNotification } = require('../utils/socialHelpers');
const { uploadFromBuffer } = require('../utils/cloudinary');
const FounderProfile = require('../models/FounderProfile');
const InvestorProfile = require('../models/InvestorProfile');
const JobSeekerProfile = require('../models/JobSeekerProfile');
const Startup = require('../models/Startup');

// @desc    Get Founder Score and Tips
// @route   GET /api/users/score
// @access  Private
exports.getFounderScore = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Get stats
    const postsCount = await Post.countDocuments({ user: req.user.id });
    const commentsCount = await Post.countDocuments({ "comments.user": req.user.id });
    
    // For response rate, we'd need Message model stats or Question stats
    // Placeholder for now
    const responseRate = 85; 

    const { score, tips } = calculateFounderScore(user, { postsCount, commentsCount, responseRate });

    // Update score in DB if changed
    if (user.founderScore !== score) {
      user.founderScore = score;
      await user.save();
    }

    res.status(200).json({
      success: true,
      data: {
        score,
        tips
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get user followers
// @route   GET /api/users/:id/followers
// @access  Public
exports.getFollowers = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name username profileImage role tagline');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      count: user.followers.length,
      data: user.followers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get user following
// @route   GET /api/users/:id/following
// @access  Public
exports.getFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('following', 'name username profileImage role tagline');

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      count: user.following.length,
      data: user.following
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get mutual connections
// @route   GET /api/users/:id/mutuals
// @access  Private
exports.getMutualConnections = async (req, res) => {
  try {
    if (!req.user) {
       return res.status(401).json({ success: false, error: 'Not authorized' });
    }
    
    const user = await User.findById(req.user.id);
    const otherUser = await User.findById(req.params.id);

    if (!otherUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Mutuals are people I follow who also follow the other user? 
    // Or people who follow both of us? 
    // Usually "Mutual Connections" on LinkedIn means:
    // People I am connected to (follow/follow back) who are also connected to them.
    // For simple follow system: Intersection of my following and their followers? 
    // Or intersection of my following and their following?
    // Let's assume intersection of 'following' lists (people we both follow) or 'followers' (people who follow both).
    // Let's go with: People I follow who also follow the target user (if bidirectional).
    // Simpler definition: Users present in both my 'following' and their 'followers' (if I want to see who I know that knows them).
    
    // Let's use intersection of "My Following" and "Their Followers".
    const myFollowing = user.following.map(id => id.toString());
    const theirFollowers = otherUser.followers.map(id => id.toString());
    
    const mutualIds = myFollowing.filter(id => theirFollowers.includes(id));
    
    const mutuals = await User.find({ _id: { $in: mutualIds } })
        .select('name username profileImage role tagline');

    res.status(200).json({
        success: true,
        count: mutuals.length,
        data: mutuals
    });
  } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Public
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .populate('founderProfile')
            .populate('investorProfile');
        const usersPublic = users.map(user => user.toPublicJSON());
        res.status(200).json({ success: true, count: users.length, data: usersPublic });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('following', 'name username profileImage')
            .populate('followers', 'name username profileImage')
            .populate({
                path: 'founderProfile',
                populate: {
                    path: 'startups',
                    select: 'name logo oneLinePitch slug'
                }
            })
            .populate('investorProfile');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: user.toPublicJSON() });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get user by username
// @route   GET /api/users/handle/:username
// @access  Public
exports.getUserByUsername = async (req, res) => {
    try {
        const query = req.params.username.match(/^[0-9a-fA-F]{24}$/)
            ? { $or: [{ username: req.params.username }, { _id: req.params.username }] }
            : { username: req.params.username };

        const user = await User.findOne(query)
            .select('-password')
            .populate('following', 'name username profileImage')
            .populate('followers', 'name username profileImage')
            .populate({
                path: 'founderProfile',
                populate: {
                    path: 'startups',
                    select: 'name logo oneLinePitch slug'
                }
            })
            .populate('investorProfile');

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: user.toPublicJSON() });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/update
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Apply fields from body
        if (req.body.name !== undefined) user.name = req.body.name;
        if (req.body.bio !== undefined) user.bio = req.body.bio;
        if (req.body.tagline !== undefined) user.tagline = req.body.tagline;
        if (req.body.headline !== undefined) user.headline = req.body.headline;
        if (req.body.currentRole !== undefined) user.currentRole = req.body.currentRole;
        if (req.body.industry !== undefined) user.industry = req.body.industry;
        if (req.body.about !== undefined) user.about = req.body.about;
        if (req.body.story !== undefined) user.story = req.body.story;
        if (req.body.location !== undefined) user.location = req.body.location;
        if (req.body.socialLinks !== undefined) user.socialLinks = req.body.socialLinks;
        if (req.body.skills !== undefined) user.skills = req.body.skills;
        if (req.body.interests !== undefined) user.interests = req.body.interests;
        if (req.body.experience !== undefined) user.experience = req.body.experience;
        if (req.body.vision !== undefined) user.vision = req.body.vision;
        if (req.body.tools !== undefined) user.tools = req.body.tools;
        if (req.body.lookingFor !== undefined) user.lookingFor = req.body.lookingFor;
        if (req.body.role !== undefined) user.role = req.body.role;

        // Support top-level social link saving if sent that way
        if (req.body.website !== undefined) {
          if (!user.socialLinks) user.socialLinks = {};
          user.socialLinks.website = req.body.website;
        }
        if (req.body.linkedin !== undefined) {
          if (!user.socialLinks) user.socialLinks = {};
          user.socialLinks.linkedin = req.body.linkedin;
        }
        if (req.body.github !== undefined) {
          if (!user.socialLinks) user.socialLinks = {};
          user.socialLinks.github = req.body.github;
        }

        // Photo fields support
        if (req.body.profilePhoto !== undefined) user.profileImage = req.body.profilePhoto;
        if (req.body.profileImage !== undefined) user.profileImage = req.body.profileImage;
        if (req.body.coverPhoto !== undefined) user.coverImage = req.body.coverPhoto;
        if (req.body.coverImage !== undefined) user.coverImage = req.body.coverImage;

        // Calculate profile completion flag
        const bioVal = user.bio || user.headline || user.tagline;
        const roleVal = user.role;
        const locVal = user.location;
        const hasLocation = locVal && (
          (typeof locVal === 'object' && (locVal.city || locVal.country)) ||
          (typeof locVal === 'string' && locVal.trim().length > 0)
        );
        
        user.isProfileComplete = Boolean(bioVal && roleVal && hasLocation);

        await user.save();

        // Update corresponding role profile model if roleProfileData is supplied
        if (req.body.roleProfileData) {
          const rData = req.body.roleProfileData;
          if (user.role === 'founder') {
            let founderProfile = await FounderProfile.findOne({ user: user._id });
            if (!founderProfile) {
              founderProfile = new FounderProfile({ user: user._id });
            }
            if (rData.pitchDeckUrl !== undefined) founderProfile.pitchDeckUrl = rData.pitchDeckUrl;
            if (rData.pitchVideoUrl !== undefined) founderProfile.pitchVideoUrl = rData.pitchVideoUrl;
            if (rData.equityOffering !== undefined) founderProfile.equityOffering = rData.equityOffering;
            if (rData.traction !== undefined) founderProfile.traction = rData.traction;
            if (rData.website !== undefined) founderProfile.website = rData.website;
            if (rData.socialLinks !== undefined) founderProfile.socialLinks = rData.socialLinks;
            await founderProfile.save();
          } else if (user.role === 'investor') {
            let investorProfile = await InvestorProfile.findOne({ user: user._id });
            if (!investorProfile) {
              investorProfile = new InvestorProfile({ user: user._id });
            }
            if (rData.investorType !== undefined) investorProfile.investorType = rData.investorType;
            if (rData.investor_type !== undefined) investorProfile.investor_type = rData.investor_type;
            if (rData.open_to_invest !== undefined) investorProfile.open_to_invest = rData.open_to_invest;
            if (rData.investment_focus !== undefined) investorProfile.investment_focus = rData.investment_focus;
            if (rData.portfolio_count !== undefined) investorProfile.portfolio_count = Number(rData.portfolio_count);
            if (rData.verified_investor !== undefined) investorProfile.verified_investor = rData.verified_investor;
            if (rData.location !== undefined) investorProfile.location = rData.location;
            if (rData.bio !== undefined) investorProfile.bio = rData.bio;
            if (rData.preferredIndustries !== undefined) {
              investorProfile.preferredIndustries = Array.isArray(rData.preferredIndustries)
                ? rData.preferredIndustries
                : rData.preferredIndustries.split(',').map(s => s.trim()).filter(s => s);
            }
            if (rData.preferred_industries !== undefined) {
              investorProfile.preferred_industries = Array.isArray(rData.preferred_industries)
                ? rData.preferred_industries
                : rData.preferred_industries.split(',').map(s => s.trim()).filter(s => s);
            }
            if (rData.ticketSize !== undefined) {
              investorProfile.ticketSize = {
                min: rData.ticketSize.min !== undefined ? Number(rData.ticketSize.min) : investorProfile.ticketSize.min,
                max: rData.ticketSize.max !== undefined ? Number(rData.ticketSize.max) : investorProfile.ticketSize.max
              };
            }
            if (rData.ticket_size_min !== undefined) investorProfile.ticket_size_min = Number(rData.ticket_size_min);
            if (rData.ticket_size_max !== undefined) investorProfile.ticket_size_max = Number(rData.ticket_size_max);
            if (rData.preferredStages !== undefined) investorProfile.preferredStages = rData.preferredStages;
            await investorProfile.save();
          }
        }

        // Populate virtuals
        await user.populate({
            path: 'founderProfile',
            populate: {
                path: 'startups',
                select: 'name logo oneLinePitch slug'
            }
        });
        await user.populate('investorProfile');

        const updatedUser = user.toPublicJSON();

        // Console debug checks
        console.log('--- DEBUG PROFILE SAVE ---');
        console.log('updatedUser:', updatedUser);
        console.log('updatedUser.isProfileComplete:', updatedUser.isProfileComplete);
        console.log('updatedUser.bio:', updatedUser.bio);
        console.log('updatedUser.location:', updatedUser.location);
        console.log('--------------------------');

        res.status(200).json({ success: true, user: updatedUser, data: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

const saveUserFileLocally = async (req, file, subFolder) => {
    const publicDir = path.join(__dirname, '../public');
    const uploadDir = path.join(publicDir, 'uploads');
    const typeDir = path.join(uploadDir, subFolder);

    // Create directories if they do not exist
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    if (!fs.existsSync(typeDir)) fs.mkdirSync(typeDir, { recursive: true });

    const timestamp = Date.now();
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';

    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `user_${timestamp}_${cleanName}`;
    const filePath = path.join(typeDir, filename);
    
    fs.writeFileSync(filePath, file.buffer);
    
    const url = `${protocol}://${host}/public/uploads/${subFolder}/${filename}`;
    return url;
};

// @desc    Upload avatar
// @route   POST /api/users/upload-avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a file' });
        }

        const isCloudinaryConfigured =
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
            process.env.CLOUDINARY_API_SECRET &&
            process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

        let profileImageUrl = '';
        if (isCloudinaryConfigured) {
            try {
                console.log('Attempting Cloudinary avatar upload...');
                const result = await uploadFromBuffer(req.file.buffer, 'avatars');
                profileImageUrl = result.secure_url;
            } catch (err) {
                console.error('Cloudinary avatar upload failed, falling back to local:', err);
                profileImageUrl = await saveUserFileLocally(req, req.file, 'avatars');
            }
        } else {
            console.log('Cloudinary not configured on backend, saving avatar locally...');
            profileImageUrl = await saveUserFileLocally(req, req.file, 'avatars');
        }

        const user = await User.findByIdAndUpdate(req.user.id, { profileImage: profileImageUrl }, { new: true });

        res.status(200).json({ success: true, data: user.profileImage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Upload cover image
// @route   POST /api/users/upload-cover
// @access  Private
exports.uploadCover = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a file' });
        }

        const isCloudinaryConfigured =
            process.env.CLOUDINARY_CLOUD_NAME &&
            process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
            process.env.CLOUDINARY_API_KEY &&
            process.env.CLOUDINARY_API_KEY !== 'your_api_key' &&
            process.env.CLOUDINARY_API_SECRET &&
            process.env.CLOUDINARY_API_SECRET !== 'your_api_secret';

        let coverImageUrl = '';
        if (isCloudinaryConfigured) {
            try {
                console.log('Attempting Cloudinary cover upload...');
                const result = await uploadFromBuffer(req.file.buffer, 'covers');
                coverImageUrl = result.secure_url;
            } catch (err) {
                console.error('Cloudinary cover upload failed, falling back to local:', err);
                coverImageUrl = await saveUserFileLocally(req, req.file, 'covers');
            }
        } else {
            console.log('Cloudinary not configured on backend, saving cover locally...');
            coverImageUrl = await saveUserFileLocally(req, req.file, 'covers');
        }

        const user = await User.findByIdAndUpdate(req.user.id, { coverImage: coverImageUrl }, { new: true });

        res.status(200).json({ success: true, data: user.coverImage });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Public
exports.searchUsers = async (req, res) => {
    try {
        const { q } = req.query;
        const users = await User.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } },
                { role: { $regex: q, $options: 'i' } }
            ]
        }).select('name username profileImage role tagline');

        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
exports.followUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        if (user.following.includes(req.params.id)) {
            // Unfollow
            user.following.pull(req.params.id);
            targetUser.followers.pull(req.user.id);
            await user.save();
            await targetUser.save();
            return res.status(200).json({ success: true, data: { isFollowing: false } });
        } else {
            // Follow
            user.following.push(req.params.id);
            targetUser.followers.push(req.user.id);
            await user.save();
            await targetUser.save();
            
            await createNotification({
                recipient: targetUser._id,
                sender: user._id,
                type: 'follow',
                entityId: user._id,
                entityType: 'User'
            }, req.app.get('io'));

            return res.status(200).json({ success: true, data: { isFollowing: true } });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Toggle Pin Post
// @route   PUT /api/users/pin/:postId
// @access  Private
exports.togglePinPost = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.pinnedPost && user.pinnedPost.toString() === req.params.postId) {
            user.pinnedPost = undefined;
        } else {
            user.pinnedPost = req.params.postId;
        }
        await user.save();
        res.status(200).json({ success: true, data: user.pinnedPost });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get Bookmarks
// @route   GET /api/users/bookmarks
// @access  Private
exports.getBookmarks = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .populate('savedPosts')
            .populate('savedStartups');
        
        res.status(200).json({ 
            success: true, 
            data: { 
                posts: user.savedPosts, 
                startups: user.savedStartups 
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Record profile view
// @route   POST /api/users/:id/view
// @access  Private
exports.recordProfileView = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });
        
        // Logic to record view...
        const lastView = user.profileViews.find(v => 
          v.viewerId.toString() === req.user.id && 
          v.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
        );
    
        if (!lastView) {
          user.profileViews.push({ viewerId: req.user.id });
          await user.save();
        }
    
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Get profile views
// @route   GET /api/users/profile-views
// @access  Private
exports.getProfileViews = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('profileViews.viewerId', 'name username profileImage role');

    let views = user.profileViews.sort((a, b) => b.timestamp - a.timestamp);
    const totalViews = views.length;

    if (!user.isPremium) {
       // Limit to last 3 views for free users
       views = views.slice(0, 3);
    }

    res.status(200).json({
      success: true,
      data: views,
      total: totalViews,
      isPremium: user.isPremium,
      message: !user.isPremium ? 'Upgrade to Premium to see all views' : ''
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Block a user
// @route   POST /api/users/block/:id
// @access  Private
exports.blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const userToBlock = await User.findById(req.params.id);

    if (!userToBlock) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.blockedUsers.includes(req.params.id)) {
      return res.status(400).json({ success: false, error: 'User already blocked' });
    }

    // Add to blocked list
    user.blockedUsers.push(req.params.id);
    
    // Also unfollow if following
    if (user.following.includes(req.params.id)) {
        user.following.pull(req.params.id);
        userToBlock.followers.pull(req.user.id);
        await userToBlock.save();
    }
    
    // Also remove from their following (force unfollow me)
    if (user.followers.includes(req.params.id)) {
        user.followers.pull(req.params.id);
        userToBlock.following.pull(req.user.id);
        await userToBlock.save();
    }

    await user.save();
    
    res.status(200).json({ success: true, data: user.blockedUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Unblock a user
// @route   POST /api/users/unblock/:id
// @access  Private
exports.unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user.blockedUsers.includes(req.params.id)) {
      return res.status(400).json({ success: false, error: 'User not blocked' });
    }

    user.blockedUsers.pull(req.params.id);
    await user.save();

    res.status(200).json({ success: true, data: user.blockedUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Setup Job Seeker Profile
// @route   POST /api/profile/job-seeker
// @access  Private
exports.setupJobSeekerProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'user' && user.role !== 'job_seeker') {
      return res.status(400).json({ success: false, error: 'User is not registered as a User / Job Seeker' });
    }

    const {
      profilePhoto,
      bio,
      skills,
      education,
      experience,
      resume,
      portfolioLink,
      github,
      linkedin,
      location,
      preferredJobType,
      expectedSalary
    } = req.body;

    let profile = await JobSeekerProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new JobSeekerProfile({ userId: user._id });
    }

    profile.profilePhoto = profilePhoto || '';
    profile.bio = bio || '';
    profile.skills = Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean);
    profile.education = education || '';
    profile.experience = experience || '';
    profile.resume = resume || '';
    profile.portfolioLink = portfolioLink || '';
    profile.github = github || '';
    profile.linkedin = linkedin || '';
    profile.location = location || '';
    profile.preferredJobType = preferredJobType || '';
    profile.expectedSalary = expectedSalary || '';

    await profile.save();

    // Update User model
    user.bio = bio || '';
    user.profileImage = profilePhoto || user.profileImage || '';
    user.skills = profile.skills;
    if (location) {
      const parts = location.split(',').map(s => s.trim());
      user.location = parts.length >= 2
        ? { city: parts[0], country: parts[parts.length - 1] }
        : { city: location, country: '' };
    }
    user.profileCompleted = true;
    user.isProfileComplete = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile completed successfully',
      user: user.toPublicJSON(),
      profile
    });
  } catch (error) {
    console.error('Error setupJobSeekerProfile:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Setup Founder Profile
// @route   POST /api/profile/founder
// @access  Private
exports.setupFounderProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'founder') {
      return res.status(400).json({ success: false, error: 'User is not registered as a Founder' });
    }

    const {
      profilePhoto,
      bio,
      skills,
      experience,
      linkedin,
      location,
      startupName,
      startupLogo,
      industry,
      startupStage,
      problemStatement,
      solution,
      website,
      pitchDeck,
      fundingNeeded,
      teamSize
    } = req.body;

    if (!startupName) {
      return res.status(400).json({ success: false, error: 'Startup Name is required' });
    }

    let profile = await FounderProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new FounderProfile({ userId: user._id });
    }

    profile.profilePhoto = profilePhoto || '';
    profile.bio = bio || '';
    profile.skills = Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean);
    profile.experience = experience || '';
    profile.linkedin = linkedin || '';
    profile.location = location || '';

    await profile.save();

    // Create / Update Startup Profile
    let startup = await Startup.findOne({ founderId: user._id });
    if (!startup) {
      startup = new Startup({ founderId: user._id, name: startupName, oneLinePitch: `${industry || 'Tech'} Startup`, description: problemStatement || 'Startup description', contactEmail: user.email, industry: industry || 'Technology' });
    }

    startup.name = startupName;
    startup.logo = startupLogo || '';
    startup.industry = industry || 'Technology';
    startup.stage = startupStage || 'idea';
    startup.problemStatement = problemStatement || '';
    startup.problem = problemStatement || ''; // Compatibility
    startup.solution = solution || '';
    startup.description = (problemStatement && solution) ? `${problemStatement}\n\nSolution:\n${solution}` : (problemStatement || solution || 'Startup description');
    startup.oneLinePitch = `${startupStage || 'Early'} stage startup in ${industry || 'Technology'}`;
    startup.website = website || '';
    startup.pitchDeck = pitchDeck || '';
    startup.fundingNeeded = Number(fundingNeeded) || 0;
    startup.fundingRequired = Number(fundingNeeded) || 0; // Compatibility
    startup.teamSize = Number(teamSize) || 1;

    await startup.save();

    // Link startup to founder profile
    if (!profile.startups.includes(startup._id)) {
      profile.startups.push(startup._id);
      await profile.save();
    }

    // Update User model
    user.bio = bio || '';
    user.profileImage = profilePhoto || user.profileImage || '';
    user.skills = profile.skills;
    if (location) {
      const parts = location.split(',').map(s => s.trim());
      user.location = parts.length >= 2
        ? { city: parts[0], country: parts[parts.length - 1] }
        : { city: location, country: '' };
    }
    user.profileCompleted = true;
    user.isProfileComplete = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Founder and Startup profiles completed successfully',
      user: user.toPublicJSON(),
      profile,
      startup
    });
  } catch (error) {
    console.error('Error setupFounderProfile:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Setup Investor Profile
// @route   POST /api/profile/investor
// @access  Private
exports.setupInvestorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.role !== 'investor') {
      return res.status(400).json({ success: false, error: 'User is not registered as an Investor' });
    }

    const {
      profilePhoto,
      bio,
      investorType,
      investmentMin,
      investmentMax,
      preferredIndustries,
      location,
      portfolioCompanies,
      linkedin,
      website
    } = req.body;

    let profile = await InvestorProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new InvestorProfile({ userId: user._id });
    }

    profile.profilePhoto = profilePhoto || '';
    profile.bio = bio || '';
    profile.investorType = investorType || 'Angel';
    profile.investmentMin = Number(investmentMin) || 0;
    profile.investmentMax = Number(investmentMax) || 0;
    profile.preferredIndustries = Array.isArray(preferredIndustries) ? preferredIndustries : (preferredIndustries || '').split(',').map(s => s.trim()).filter(Boolean);
    profile.location = location || '';
    profile.portfolioCompanies = Array.isArray(portfolioCompanies) ? portfolioCompanies : (portfolioCompanies || '').split(',').map(s => s.trim()).filter(Boolean);
    profile.linkedin = linkedin || '';
    profile.website = website || '';

    // Compatibility fields mapping
    profile.ticket_size_min = profile.investmentMin;
    profile.ticket_size_max = profile.investmentMax;
    profile.ticketSize = { min: profile.investmentMin, max: profile.investmentMax };
    profile.investor_type = investorType;
    profile.preferred_industries = profile.preferredIndustries;

    await profile.save();

    // Update User model
    user.bio = bio || '';
    user.profileImage = profilePhoto || user.profileImage || '';
    user.skills = profile.preferredIndustries;
    if (location) {
      const parts = location.split(',').map(s => s.trim());
      user.location = parts.length >= 2
        ? { city: parts[0], country: parts[parts.length - 1] }
        : { city: location, country: '' };
    }
    user.profileCompleted = true;
    user.isProfileComplete = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Investor profile completed successfully',
      user: user.toPublicJSON(),
      profile
    });
  } catch (error) {
    console.error('Error setupInvestorProfile:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Change password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Please fill in all fields' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: 'Incorrect current password' });
    }

    user.passwordHash = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
