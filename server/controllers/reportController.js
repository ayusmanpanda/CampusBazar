const Report = require('../models/Report');
const User = require('../models/User');
const Listing = require('../models/Listing');

const REPORT_BAN_THRESHOLD = 5;

exports.createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    // Sanity check the target exists
    if (targetType === 'user') {
      const exists = await User.exists({ _id: targetId });
      if (!exists) return res.status(404).json({ message: 'Target user not found' });
    } else if (targetType === 'listing') {
      const exists = await Listing.exists({ _id: targetId });
      if (!exists) return res.status(404).json({ message: 'Target listing not found' });
    }

    if (String(req.user._id) === String(targetId)) {
      return res.status(400).json({ message: "You can't report yourself" });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      reason,
      description: description || ''
    });

    // If reports against a user crosses the threshold, auto-ban
    if (targetType === 'user') {
      const targetUserId =
        targetType === 'user' ? targetId : null;
      if (targetUserId) {
        const count = await Report.countDocuments({ targetType: 'user', targetId: targetUserId });
        await User.findByIdAndUpdate(targetUserId, { reportCount: count });
        if (count >= REPORT_BAN_THRESHOLD) {
          await User.findByIdAndUpdate(targetUserId, {
            isBanned: true,
            banReason: `Auto-banned: ${count} reports`
          });
        }
      }
    }

    res.status(201).json(report);
  } catch (err) {
    next(err);
  }
};
