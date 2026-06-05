const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get user settings
// @route   GET /api/settings
// @access  Private
exports.getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -emailVerificationOtp -emailVerificationExpires');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update account settings
// @route   PUT /api/settings/account
// @access  Private
exports.updateAccount = async (req, res) => {
  try {
    const { fullName, username, email, bio } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check username uniqueness if changed
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username: username.toLowerCase(), _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Username already taken' });
      }
      user.username = username.toLowerCase();
    }

    // Check email uniqueness if changed
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (existingEmail) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
      user.email = email.toLowerCase();
      user.isEmailVerified = false; // Re-verify new email
    }

    if (fullName !== undefined) {
      user.fullName = fullName;
      user.name = fullName;
    }
    if (bio !== undefined) user.bio = bio;

    await user.save();

    res.status(200).json({ success: true, data: user.toPublicJSON(), message: 'Account updated successfully' });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update privacy settings
// @route   PUT /api/settings/privacy
// @access  Private
exports.updatePrivacy = async (req, res) => {
  try {
    const { profileVisibility, messagePermission, showInvestmentInterests } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.privacySettings) user.privacySettings = {};
    if (profileVisibility !== undefined) user.privacySettings.profileVisibility = profileVisibility;
    if (messagePermission !== undefined) user.privacySettings.messagePermission = messagePermission;
    if (showInvestmentInterests !== undefined) user.privacySettings.showInvestmentInterests = showInvestmentInterests;

    await user.save();

    res.status(200).json({ success: true, data: user.privacySettings, message: 'Privacy settings updated' });
  } catch (error) {
    console.error('Error updating privacy:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Update notification preferences
// @route   PUT /api/settings/notifications
// @access  Private
exports.updateNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.notificationPreferences) user.notificationPreferences = {};
    const prefs = req.body;
    const validKeys = ['emailNotifications', 'pushNotifications', 'newFollower', 'newMessage', 'investorInterest', 'startupUpdates', 'weeklyDigest', 'marketingEmails'];
    
    for (const key of validKeys) {
      if (prefs[key] !== undefined) {
        user.notificationPreferences[key] = prefs[key];
      }
    }

    await user.save();

    res.status(200).json({ success: true, data: user.notificationPreferences, message: 'Notification preferences updated' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Delete account
// @route   DELETE /api/settings/account
// @access  Private
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // If user has a password (not Google-only), verify it
    if (user.passwordHash) {
      if (!password) {
        return res.status(400).json({ success: false, error: 'Password is required to delete account' });
      }
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Incorrect password' });
      }
    }

    // Soft delete: mark inactive
    user.isActive = false;
    user.email = `deleted_${user._id}_${user.email}`;
    user.username = `deleted_${user._id}_${user.username}`;
    await user.save();

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Export user data
// @route   GET /api/settings/export
// @access  Private
exports.exportData = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-passwordHash -emailVerificationOtp -emailVerificationExpires')
      .populate('followers', 'fullName username email')
      .populate('following', 'fullName username email')
      .lean();
      
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="founderx_data_${user.username}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ success: true, exportedAt: new Date().toISOString(), data: user });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
