const { getAll, getById, updateById } = require('../utils/firebaseHelpers');

exports.getReports = async (req, res) => {
  try {
    let reports = await getAll('reports');
    reports = reports.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const populated = await Promise.all(
      reports.map(async (report) => {
        if (report.reporterId) {
          const reporter = await getById('users', report.reporterId);
          if (reporter) {
            report.reporterId = {
              id: reporter.id,
              name: reporter.name || reporter.fullName,
              email: reporter.email,
              username: reporter.username
            };
          }
        }
        return report;
      })
    );

    res.status(200).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Reviewed', 'Resolved', 'Dismissed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const report = await getById('reports', req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const updated = await updateById('reports', req.params.id, { status });
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating report status:', err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
