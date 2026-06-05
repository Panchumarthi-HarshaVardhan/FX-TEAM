const {
  getAll,
  getById,
  create,
  updateById,
  deleteById,
  findOneByField,
  filter
} = require('../utils/firebaseHelpers');

exports.submitRequest = async (req, res) => {
  try {
    const { targetType, targetId, type, proof } = req.body;

    if (!targetType || !targetId || !type) {
      return res.status(400).json({ success: false, error: 'targetType, targetId, and type are required' });
    }

    if (targetType === 'user') {
      if (targetId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }
      const user = await getById('users', targetId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      await updateById('users', targetId, {
        verificationStatus: 'pending',
        verificationProof: proof,
        verificationType: type
      });
    } else if (targetType === 'startup') {
      const startup = await getById('startups', targetId);
      if (!startup) {
        return res.status(404).json({ success: false, error: 'Startup not found' });
      }
      if (startup.founderId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }
      await updateById('startups', targetId, {
        verificationStatus: 'pending',
        verificationProof: proof
      });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid targetType' });
    }

    const request = await create('verificationRequests', {
      requesterId: req.user.id,
      targetType: targetType.toLowerCase(),
      targetId,
      type,
      proof: proof || '',
      status: 'pending',
      submittedAt: Date.now()
    });

    res.status(201).json({ success: true, data: request });
  } catch (error) {
    console.error('Submit verification request error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;

    let requests = await getAll('verificationRequests');

    if (status) {
      requests = requests.filter((r) => r.status === status);
    }

    requests = requests.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));

    const total = requests.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedRequests = requests.slice(skip, skip + limitNum);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / limitNum),
      data: paginatedRequests
    });
  } catch (error) {
    console.error('Get verification requests error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await getById('verificationRequests', id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    await updateById('verificationRequests', id, {
      status: 'approved',
      approvedAt: Date.now(),
      approvedBy: req.user.id
    });

    if (request.targetType === 'user') {
      await updateById('users', request.targetId, {
        isVerified: true,
        verificationStatus: 'verified'
      });
    } else if (request.targetType === 'startup') {
      await updateById('startups', request.targetId, {
        isVerified: true,
        verified: true,
        verificationStatus: 'verified'
      });
    }

    res.status(200).json({ success: true, message: 'Request approved' });
  } catch (error) {
    console.error('Approve verification request error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const request = await getById('verificationRequests', id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    await updateById('verificationRequests', id, {
      status: 'rejected',
      rejectionReason: reason || '',
      rejectedAt: Date.now(),
      rejectedBy: req.user.id
    });

    if (request.targetType === 'user') {
      await updateById('users', request.targetId, {
        verificationStatus: 'rejected'
      });
    } else if (request.targetType === 'startup') {
      await updateById('startups', request.targetId, {
        verificationStatus: 'rejected'
      });
    }

    res.status(200).json({ success: true, message: 'Request rejected' });
  } catch (error) {
    console.error('Reject verification request error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await getById('verificationRequests', id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    res.status(200).json({ success: true, data: request });
  } catch (error) {
    console.error('Get verification request error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await getById('verificationRequests', id);

    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (request.requesterId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    await deleteById('verificationRequests', id);
    res.status(200).json({ success: true, message: 'Request deleted' });
  } catch (error) {
    console.error('Delete verification request error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getUserVerifications = async (req, res) => {
  try {
    const { id } = req.params;
    const verifications = await filter('verificationRequests', (v) => v.targetId === id && v.targetType === 'user');

    res.status(200).json({
      success: true,
      count: verifications.length,
      data: verifications
    });
  } catch (error) {
    console.error('Get user verifications error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getStartupVerifications = async (req, res) => {
  try {
    const { id } = req.params;
    const verifications = await filter('verificationRequests', (v) => v.targetId === id && v.targetType === 'startup');

    res.status(200).json({
      success: true,
      count: verifications.length,
      data: verifications
    });
  } catch (error) {
    console.error('Get startup verifications error:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.reviewRequest = async (req, res) => {
  if (req.body.status === 'approved') {
    return exports.approveRequest(req, res);
  }
  return exports.rejectRequest(req, res);
};

exports.submitFounderVerification = async (req, res) => {
  req.body = { ...req.body, targetType: 'user', targetId: req.user.id, type: 'founder' };
  return exports.submitRequest(req, res);
};

exports.submitInvestorVerification = async (req, res) => {
  req.body = { ...req.body, targetType: 'user', targetId: req.user.id, type: 'investor' };
  return exports.submitRequest(req, res);
};

exports.getSpecializedVerifications = exports.getRequests;
exports.updateSpecializedVerificationStatus = exports.reviewRequest;
