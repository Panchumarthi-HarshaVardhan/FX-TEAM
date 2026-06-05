const express = require('express');
const router = express.Router();
const { getById, create, findOneByFields, getAll } = require('../utils/firebaseHelpers');
const { createNotification } = require('../utils/socialHelpers');
const { protect } = require('../middleware/auth');

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
      resumeUrl,
      portfolioUrl,
      message
    } = req.body;

    let job = await getById('jobOpenings', jobId);
    let startupId = null;
    let founderId = null;
    let jobTitle = '';

    if (!job) {
      const startups = await getAll('startups');
      const startupWithJob = startups.find((s) => (s.jobs || []).some((j) => j.id === jobId || j._id === jobId));
      if (!startupWithJob) {
        return res.status(404).json({ success: false, error: 'Job opening not found' });
      }
      const subJob = (startupWithJob.jobs || []).find((j) => j.id === jobId || j._id === jobId);
      startupId = startupWithJob.id;
      founderId = startupWithJob.founderId;
      jobTitle = subJob.title;
      job = { id: jobId, startupId, founderId, title: subJob.title };
    } else {
      startupId = job.startupId;
      founderId = job.founderId;
      jobTitle = job.title;
    }

    if (req.user.role === 'investor') {
      return res.status(403).json({ success: false, error: 'Investors cannot apply for jobs' });
    }

    const existingApp = await findOneByFields('jobApplications', { jobId, applicantId: req.user.id });
    if (existingApp) {
      return res.status(400).json({ success: false, error: 'You have already applied to this job' });
    }

    const application = await create('jobApplications', {
      jobId,
      startupId: job.startupId,
      founderId: job.founderId,
      applicantId: req.user.id,
      resume: resume || resumeUrl || 'No resume uploaded',
      coverLetter: coverLetter || message || '',
      portfolioLink: portfolioLink || portfolioUrl || '',
      github: github || '',
      linkedin: linkedin || '',
      expectedSalary: expectedSalary || '',
      availabilityDate: availabilityDate ? new Date(availabilityDate).getTime() : null,
      reasonToJoin: reasonToJoin || '',
      status: 'pending'
    });

    try {
      const startup = await getById('startups', job.startupId);
      await createNotification(
        {
          recipient: job.founderId,
          sender: req.user.id,
          type: 'job_application',
          entityId: application.id,
          entityType: 'JobApplication',
          content: `${req.user.fullName || req.user.name} applied for ${job.title} at ${startup ? startup.name : 'Startup'}`
        },
        req.app.get('io')
      );
    } catch (err) {
      console.error('Error creating notification:', err);
    }

    try {
      const senderUser = await getById('users', req.user.id);
      const receiverUser = await getById('users', job.founderId);
      const startup = await getById('startups', job.startupId);
      const mailSubject = `Job Application: ${job.title} at ${startup ? startup.name : 'Startup'}`;
      const mailBody =
        coverLetter ||
        message ||
        `Hi, I am interested in the ${job.title} role. Please review my profile and application.\n\nResume: ${resume || resumeUrl || 'Attached'}`;

      await create('mails', {
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
        relatedApplicationId: application.id,
        isRead: false
      });
    } catch (mailErr) {
      console.error('Failed to create Mail item for job application:', mailErr);
    }

    res.status(201).json({ success: true, data: application, message: 'Application submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
