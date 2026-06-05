const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');
const Startup = require('../models/Startup');

exports.submitRequest = async (req, res) => {
  try {
    const { targetType, targetId, type, proof } = req.body;

    // Validate ownership
    if (targetType === 'User') {
        if (targetId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        await User.findByIdAndUpdate(targetId, {
            verificationStatus: 'pending',
            verificationProof: proof,
            verificationType: type
        });
    } else if (targetType === 'Startup') {
        const startup = await Startup.findById(targetId);
        if (!startup) {
            return res.status(404).json({ success: false, error: 'Startup not found' });
        }
        if (startup.founderId.toString() !== req.user.id) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        await Startup.findByIdAndUpdate(targetId, {
            verificationStatus: 'pending',
            verificationProof: proof
        });
    }

    const request = await VerificationRequest.create({
      requesterId: req.user.id,
      targetType,
      targetId,
      type,
      proof
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

exports.getRequests = async (req, res) => {
    try {
        const requests = await VerificationRequest.find({ status: 'pending' })
            .populate('requesterId', 'name email')
            .sort('-createdAt');
        
        // We can't easily populate polymorphic targetId in one go with simple mongoose unless we use specific strategies, 
        // but let's try to fetch them or let the frontend handle it by ID if needed.
        // Or we can iterate and populate manually if needed.
        // For now, let's return the requests.
        
        res.status(200).json({ success: true, data: requests });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

exports.reviewRequest = async (req, res) => {
    try {
        const { status, adminComment } = req.body; // 'approved' or 'rejected'
        const request = await VerificationRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ success: false, error: 'Request not found' });
        }

        request.status = status;
        request.adminComment = adminComment;
        request.reviewedBy = req.user.id;
        request.reviewedAt = Date.now();
        await request.save();

        const updateData = {
            verificationStatus: status === 'approved' ? 'verified' : 'rejected',
            isVerified: status === 'approved'
        };

        if (request.targetType === 'User') {
            await User.findByIdAndUpdate(request.targetId, updateData);
        } else {
            await Startup.findByIdAndUpdate(request.targetId, updateData);
        }

        res.status(200).json({ success: true, data: request });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

// @desc    Submit Founder Verification
// @route   POST /api/verification/founder
// @access  Private
exports.submitFounderVerification = async (req, res) => {
  try {
    const { documentUrl, panCardUrl, linkedinUrl } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.role !== 'founder') {
      return res.status(403).json({ message: 'Only founders can submit founder verification' });
    }

    user.founderVerificationData = {
      documentUrl,
      panCardUrl,
      linkedinUrl
    };
    user.founderVerificationStatus = 'pending';
    
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: 'Founder verification submitted successfully' });
  } catch (error) {
    console.error('Founder verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Submit Investor Verification
// @route   POST /api/verification/investor
// @access  Private
exports.submitInvestorVerification = async (req, res) => {
  try {
    const { panCardUrl, linkedinUrl, companyWebsite, investmentProofUrl } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.role !== 'investor') {
      return res.status(403).json({ message: 'Only investors can submit investor verification' });
    }

    user.investorVerificationData = {
      panCardUrl,
      linkedinUrl,
      companyWebsite,
      investmentProofUrl
    };
    user.investorVerificationStatus = 'pending';
    
    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: 'Investor verification submitted successfully' });
  } catch (error) {
    console.error('Investor verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get Admin Verifications (Pending & All specialized verifications)
// @route   GET /api/admin/verifications
// @access  Private/Admin
exports.getSpecializedVerifications = async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { founderVerificationStatus: { $ne: 'unverified' } },
        { investorVerificationStatus: { $ne: 'unverified' } }
      ]
    }).select('name email role founderVerificationStatus investorVerificationStatus founderVerificationData investorVerificationData adminVerificationNotes');

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error('Fetch verifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update Verification Status
// @route   PUT /api/admin/verifications/:id
// @access  Private/Admin
exports.updateSpecializedVerificationStatus = async (req, res) => {
  try {
    const { status, type, adminNotes } = req.body; // status: 'approved' | 'rejected', type: 'founder' | 'investor'
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (type === 'founder') {
      user.founderVerificationStatus = status;
      if (status === 'approved') user.isVerified = true;
    } else if (type === 'investor') {
      user.investorVerificationStatus = status;
      if (status === 'approved') user.isVerified = true;
    }

    if (adminNotes) {
      user.adminVerificationNotes = adminNotes;
    }

    await user.save({ validateBeforeSave: false });
    res.status(200).json({ success: true, message: 'Verification status updated', data: user });
  } catch (error) {
    console.error('Update verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
