const { verifyAccess } = require('../utils/jwt');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized — missing token' });

    const decoded = verifyAccess(token);
    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted) return res.status(401).json({ message: 'Account not found' });
    if (user.isBanned) return res.status(403).json({ message: 'Account banned' });

    user.lastActiveAt = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { authMiddleware };
