const express = require('express');
const router = express.Router();
const JobOpening = require('../models/JobOpening');
const JobApplication = require('../models/JobApplication');
const Startup = require('../models/Startup');
const Notification = require('../models/Notification');
const Mail = require('../models/Mail');
const User = require('../models/User');
const { protect } = require('../middleware/auth');


// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Private
router.post('/:id/apply', protect, async (req, res) => {
  try {
    const jobId = req.params.id;
    const { 
      resume, 
      coverLetter, 
      portfolioLink, 
      github, 
      linkedin, 
      expectedSalary, 
      availabilityDate, 
      reasonToJoin,
      // Fallback fields for legacy compatibility
      resumeUrl,
      portfolioUrl,
      message
    } = req.body;

    // Find the job opening in JobOpening collection
    let job = await JobOpening.findById(jobId);
    let startupId = null;
    let founderId = null;
    let jobTitle = '';

    if (!job) {
      // Look in startup subdocuments
      const startupWithJob = await Startup.findOne({ 'jobs._id': jobId });
      if (!startupWithJob) {
        return res.status(404).json({ success: false, error: 'Job opening not found' });
      }
      const subJob = startupWithJob.jobs.id(jobId);
      startupId = startupWithJob._id;
      founderId = startupWithJob.founderId;
      jobTitle = subJob.title;
      // Mock the job object
      job = {
        _id: subJob._id,
        startupId,
        founderId,
        title: subJob.title
      };
    } else {
      startupId = job.startupId;
      founderId = job.founderId;
      jobTitle = job.title;
    }

    // Role check: Investors cannot apply for jobs
    if (req.user.role === 'investor') {
      return res.status(403).json({ success: false, error: 'Investors cannot apply for jobs' });
    }

    // Check if already applied to this specific job
    const existingApp = await JobApplication.findOne({
      jobId: jobId,
      applicantId: req.user.id
    });

    if (existingApp) {
      return res.status(400).json({ success: false, error: 'You have already applied to this job' });
    }

    // Create the job application
    const application = await JobApplication.create({
      jobId: jobId,
      startupId: job.startupId,
      founderId: job.founderId,
      applicantId: req.user.id,
      resume: resume || resumeUrl || 'No resume uploaded',
      coverLetter: coverLetter || message || '',
      portfolioLink: portfolioLink || portfolioUrl || '',
      github: github || '',
      linkedin: linkedin || '',
      expectedSalary: expectedSalary || '',
      availabilityDate: availabilityDate ? new Date(availabilityDate) : null,
      reasonToJoin: reasonToJoin || '',
      status: 'pending'
    });

    // Send notification to founder
    try {
      const startup = await Startup.findById(job.startupId);
      await Notification.create({
        recipient: job.founderId,
        recipientId: job.founderId,
        sender: req.user.id,
        senderId: req.user.id,
        type: 'job_application',
        entityId: application._id,
        entityType: 'JobApplication',
        message: `${req.user.fullName || req.user.name} applied for ${job.title} at ${startup ? startup.name : 'Startup'}`,
        content: `${req.user.fullName || req.user.name} applied for ${job.title} at ${startup ? startup.name : 'Startup'}`,
        isRead: false,
        link: `/inbox?tab=job_applications`
      });
    } catch (err) {
      console.error('Error creating notification:', err);
    }

    // Create Mail item
    try {
      const senderUser = await User.findById(req.user.id);
      const receiverUser = await User.findById(job.founderId);
      const startup = await Startup.findById(job.startupId);
      const mailSubject = `Job Application: ${job.title} at ${startup ? startup.name : 'Startup'}`;
      const mailBody = coverLetter || message || `Hi, I am interested in the ${job.title} role. Please review my profile and application.\n\nResume: ${resume || resumeUrl || 'Attached'}`;

      await Mail.create({
        senderId: req.user.id,
        receiverId: job.founderId,
        senderProfileName: senderUser?.fullName || senderUser?.name || '',
        receiverProfileName: receiverUser?.fullName || receiverUser?.name || '',
        senderRole: senderUser?.role || '',
        receiverRole: receiverUser?.role || '',
        subject: mailSubject,
        body: mailBody,
        type: 'application_request',
        status: 'pending',
        actionStatus: 'pending',
        relatedStartupId: job.startupId,
        relatedApplicationId: application._id,
        isRead: false
      });
    } catch (mailErr) {
      console.error('Failed to create Mail item for job application:', mailErr);
    }

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
