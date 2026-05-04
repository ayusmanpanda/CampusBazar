const User = require('../models/User');
const Listing = require('../models/Listing');
const Report = require('../models/Report');

exports.users = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 25 } = req.query;
    const filter = q ? { $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] } : {};
    const items = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await User.countDocuments(filter);
    res.json({ items, total });
  } catch (err) {
    next(err);
  }
};

exports.listings = async (req, res, next) => {
  try {
    const { q, status, page = 1, limit = 25 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };
    const items = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Listing.countDocuments(filter);
    res.json({ items, total });
  } catch (err) {
    next(err);
  }
};

exports.reports = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 25 } = req.query;
    const filter = status ? { status } : {};
    const items = await Report.find(filter)
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const total = await Report.countDocuments(filter);
    res.json({ items, total });
  } catch (err) {
    next(err);
  }
};

exports.updateReport = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, adminNote },
      { new: true }
    );
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (err) {
    next(err);
  }
};

exports.banUser = async (req, res, next) => {
  try {
    const { isBanned = true, reason = '' } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned, banReason: reason },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};
