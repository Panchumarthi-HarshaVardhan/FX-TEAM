const bcrypt = require('bcryptjs');
const { getById, updateById, findOneByField, getAll } = require('../utils/firebaseHelpers');

const toPublicUser = (user) => {
  if (!user) return null;
  const { passwordHash, emailVerificationOtp, emailVerificationExpires, ...rest } = user;
  return rest;
};

exports.getSettings = async (req, res) => {
  try {
    const user = await getById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.status(200).json({ success: true, data: toPublicUser(user) });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { fullName, username, email, bio } = req.body;
    const user = await getById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updates = {};
    if (username && username !== user.username) {
      const existingUser = await findOneByField('users', 'username', username.toLowerCase());
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ success: false, error: 'Username already taken' });
      }
      updates.username = username.toLowerCase();
    }

    if (email && email !== user.email) {
      const existingEmail = await findOneByField('users', 'email', email.toLowerCase());
      if (existingEmail && existingEmail.id !== user.id) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
      updates.email = email.toLowerCase();
      updates.isEmailVerified = false;
    }

    if (fullName !== undefined) {
      updates.fullName = fullName;
      updates.name = fullName;
    }
    if (bio !== undefined) updates.bio = bio;

    const updated = await updateById('users', req.user.id, updates);
    res.status(200).json({ success: true, data: toPublicUser(updated), message: 'Account updated successfully' });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updatePrivacy = async (req, res) => {
  try {
    const { profileVisibility, messagePermission, showInvestmentInterests } = req.body;
    const user = await getById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const privacySettings = { ...(user.privacySettings || {}) };
    if (profileVisibility !== undefined) privacySettings.profileVisibility = profileVisibility;
    if (messagePermission !== undefined) privacySettings.messagePermission = messagePermission;
    if (showInvestmentInterests !== undefined) privacySettings.showInvestmentInterests = showInvestmentInterests;

    const updated = await updateById('users', req.user.id, { privacySettings });
    res.status(200).json({ success: true, data: updated.privacySettings, message: 'Privacy settings updated' });
  } catch (error) {
    console.error('Error updating privacy:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateNotifications = async (req, res) => {
  try {
    const user = await getById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const notificationPreferences = { ...(user.notificationPreferences || {}) };
    const validKeys = ['emailNotifications', 'pushNotifications', 'newFollower', 'newMessage', 'investorInterest', 'startupUpdates', 'weeklyDigest', 'marketingEmails'];
    for (const key of validKeys) {
      if (req.body[key] !== undefined) {
        notificationPreferences[key] = req.body[key];
      }
    }

    const updated = await updateById('users', req.user.id, { notificationPreferences });
    res.status(200).json({ success: true, data: updated.notificationPreferences, message: 'Notification preferences updated' });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await getById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.passwordHash) {
      if (!password) {
        return res.status(400).json({ success: false, error: 'Password is required to delete account' });
      }
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, error: 'Incorrect password' });
      }
    }

    await updateById('users', req.user.id, {
      isActive: false,
      email: `deleted_${user.id}_${user.email}`,
      username: `deleted_${user.id}_${user.username}`
    });

    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.exportData = async (req, res) => {
  try {
    const user = await getById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const exportData = toPublicUser(user);
    if (user.followers?.length) {
      exportData.followers = (await Promise.all(user.followers.map((id) => getById('users', id)))).filter(Boolean);
    }
    if (user.following?.length) {
      exportData.following = (await Promise.all(user.following.map((id) => getById('users', id)))).filter(Boolean);
    }

    res.setHeader('Content-Disposition', `attachment; filename="founderx_data_${user.username}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ success: true, exportedAt: new Date().toISOString(), data: exportData });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
