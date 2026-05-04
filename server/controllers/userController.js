const User = require('../models/User');
const Listing = require('../models/Listing');

exports.publicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      'name profilePhoto department year rating totalReviews createdAt'
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    const listings = await Listing.find({ seller: user._id, status: 'active' })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ user, listings });
  } catch (err) {
    next(err);
  }
};
