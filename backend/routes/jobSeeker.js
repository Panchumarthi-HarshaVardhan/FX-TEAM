const express = require('express');
const router = express.Router();
const User = require('../models/User');
const JobApplication = require('../models/JobApplication');
const Startup = require('../models/Startup');
const StartupTeamMember = require('../models/StartupTeamMember');
const StartupRoleRequest = require('../models/StartupRoleRequest');
const { protect } = require('../middleware/auth');

// @desc    Get job seeker applications
// @route   GET /api/job-seeker/applications
// @access  Private
router.get('/applications', protect, async (req, res) => {
  try {
    const apps = await JobApplication.find({ applicantId: req.user.id })
      .populate('startupId', 'name logo industry location')
      .populate('jobId')
      .sort('-createdAt');
    
    // Maintain fallback properties for backward compatibility
    const populatedApps = apps.map(app => {
      const appObj = app.toObject();
      if (appObj.jobId) {
        appObj.jobTitle = appObj.jobId.title;
        appObj.jobType = appObj.jobId.roleType || appObj.jobId.type;
        appObj.jobLocation = appObj.jobId.location;
        appObj.jobSalary = appObj.jobId.salaryMin ? `${appObj.jobId.salaryMin}-${appObj.jobId.salaryMax || ''}` : appObj.jobId.salary;
      }
      return appObj;
    });

    res.status(200).json({
      success: true,
      data: populatedApps
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Withdraw a job application
// @route   PATCH /api/job-seeker/applications/:applicationId/withdraw
// @access  Private
router.patch('/applications/:applicationId/withdraw', protect, async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }

    if (application.applicantId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to withdraw this application' });
    }

    if (!['pending', 'reviewed', 'shortlisted'].includes(application.status)) {
      return res.status(400).json({ success: false, error: 'Cannot withdraw application at this stage' });
    }

    application.status = 'withdrawn';
    await application.save();

    res.status(200).json({
      success: true,
      data: application,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Get job seeker saved startups
// @route   GET /api/job-seeker/saved-startups
// @access  Private
router.get('/saved-startups', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedStartups',
      select: 'name logo industry oneLinePitch location stage metrics saves founderId'
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user.savedStartups || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Get startups where user is a team member
// @route   GET /api/job-seeker/teams
// @access  Private
router.get('/teams', protect, async (req, res) => {
  try {
    const memberships = await StartupTeamMember.find({ userId: req.user.id })
      .populate({
        path: 'startupId',
        select: 'name logo industry location founderId description',
        populate: {
          path: 'founderId',
          select: 'name fullName email profileImage'
        }
      });

    res.status(200).json({
      success: true,
      data: memberships
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Get job seeker startup role requests
// @route   GET /api/job-seeker/role-requests
// @access  Private
router.get('/role-requests', protect, async (req, res) => {
  try {
    const requests = await StartupRoleRequest.find({ applicantId: req.user.id })
      .populate('startupId', 'name logo industry location')
      .populate('founderId', 'name fullName email profileImage')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

// @desc    Withdraw a custom role request
// @route   PATCH /api/job-seeker/role-requests/:id/withdraw
// @access  Private
router.patch('/role-requests/:id/withdraw', protect, async (req, res) => {
  try {
    const request = await StartupRoleRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.applicantId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to withdraw this request' });
    }

    if (!['pending', 'reviewed', 'connected'].includes(request.status)) {
      return res.status(400).json({ success: false, error: 'Cannot withdraw request at this stage' });
    }

    request.status = 'withdrawn';
    await request.save();

    res.status(200).json({
      success: true,
      data: request,
      message: 'Request withdrawn successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
