const express = require('express');
const router = express.Router();
const { getById, updateById, filter } = require('../utils/firebaseHelpers');
const { protect } = require('../middleware/auth');

const populateStartup = async (startupId) => {
  const startup = await getById('startups', startupId);
  if (!startup) return startupId;
  return {
    id: startup.id,
    _id: startup.id,
    name: startup.name,
    logo: startup.logo,
    industry: startup.industry,
    location: startup.location,
    oneLinePitch: startup.oneLinePitch,
    stage: startup.stage,
    metrics: startup.metrics,
    saves: startup.saves,
    founderId: startup.founderId
  };
};

router.get('/applications', protect, async (req, res) => {
  try {
    let apps = await filter('jobApplications', (a) => a.applicantId === req.user.id);
    apps.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const populatedApps = await Promise.all(
      apps.map(async (app) => {
        const startup = await populateStartup(app.startupId);
        const job = app.jobId ? await getById('jobOpenings', app.jobId) : null;
        const appObj = { ...app, _id: app.id, startupId: startup, jobId: job };
        if (job) {
          appObj.jobTitle = job.title;
          appObj.jobType = job.roleType || job.type;
          appObj.jobLocation = job.location;
          appObj.jobSalary = job.salaryMin ? `${job.salaryMin}-${job.salaryMax || ''}` : job.salary;
        }
        return appObj;
      })
    );

    res.status(200).json({ success: true, data: populatedApps });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.patch('/applications/:applicationId/withdraw', protect, async (req, res) => {
  try {
    const application = await getById('jobApplications', req.params.applicationId);
    if (!application) {
      return res.status(404).json({ success: false, error: 'Application not found' });
    }
    if (application.applicantId !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to withdraw this application' });
    }
    if (!['pending', 'reviewed', 'shortlisted'].includes(application.status)) {
      return res.status(400).json({ success: false, error: 'Cannot withdraw application at this stage' });
    }
    const updated = await updateById('jobApplications', req.params.applicationId, { status: 'withdrawn' });
    res.status(200).json({ success: true, data: updated, message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.get('/saved-startups', protect, async (req, res) => {
  try {
    const user = await getById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const saved = await Promise.all((user.savedStartups || []).map((id) => populateStartup(id)));
    res.status(200).json({ success: true, data: saved.filter(Boolean) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.get('/teams', protect, async (req, res) => {
  try {
    const memberships = await filter('startupTeamMembers', (m) => m.userId === req.user.id);
    const populated = await Promise.all(
      memberships.map(async (m) => {
        const startup = await getById('startups', m.startupId);
        let founder = null;
        if (startup?.founderId) {
          const f = await getById('users', startup.founderId);
          if (f) founder = { id: f.id, name: f.name || f.fullName, fullName: f.fullName, email: f.email, profileImage: f.profileImage };
        }
        return {
          ...m,
          startupId: startup
            ? { id: startup.id, name: startup.name, logo: startup.logo, industry: startup.industry, location: startup.location, founderId: founder, description: startup.description }
            : m.startupId
        };
      })
    );
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.get('/role-requests', protect, async (req, res) => {
  try {
    let requests = await filter('startupRoleRequests', (r) => r.applicantId === req.user.id);
    requests.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const populated = await Promise.all(
      requests.map(async (r) => {
        const startup = await populateStartup(r.startupId);
        const founder = r.founderId ? await getById('users', r.founderId) : null;
        return {
          ...r,
          startupId: startup,
          founderId: founder
            ? { id: founder.id, name: founder.name || founder.fullName, fullName: founder.fullName, email: founder.email, profileImage: founder.profileImage }
            : r.founderId
        };
      })
    );
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

router.patch('/role-requests/:id/withdraw', protect, async (req, res) => {
  try {
    const request = await getById('startupRoleRequests', req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }
    if (request.applicantId !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to withdraw this request' });
    }
    if (!['pending', 'reviewed', 'connected'].includes(request.status)) {
      return res.status(400).json({ success: false, error: 'Cannot withdraw request at this stage' });
    }
    const updated = await updateById('startupRoleRequests', req.params.id, { status: 'withdrawn' });
    res.status(200).json({ success: true, data: updated, message: 'Request withdrawn successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

module.exports = router;
