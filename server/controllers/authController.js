const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefresh } = require('../utils/jwt');
const { generateOtp } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/email');
const { getRedis } = require('../utils/redis');

const COLLEGE_DOMAIN = () => (process.env.COLLEGE_EMAIL_DOMAIN || 'college.edu.in').toLowerCase();

function isCollegeEmail(email) {
  return email.toLowerCase().endsWith('@' + COLLEGE_DOMAIN());
}

exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, department, year } = req.body;
    if (!isCollegeEmail(email)) {
      return res
        .status(400)
        .json({ message: `Only @${COLLEGE_DOMAIN()} emails are allowed to sign up` });
    }

    const existing = await User.findOne({ email });
    if (existing && existing.isVerified) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    let user;
    if (existing) {
      existing.name = name;
      existing.password = hash;
      existing.department = department;
      existing.year = year;
      existing.otp = otp;
      existing.otpExpiresAt = otpExpiresAt;
      user = await existing.save();
    } else {
      user = await User.create({
        name,
        email,
        password: hash,
        department,
        year,
        otp,
        otpExpiresAt,
        isVerified: false
      });
    }

    await sendOtpEmail(email, otp);
    res.status(201).json({ message: 'OTP sent to email', email });
  } catch (err) {
    next(err);
  }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select('+otp +otpExpiresAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Already verified' });
    if (!user.otp || user.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.json({ message: 'Account verified — you can now log in' });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password +refreshTokens');
    if (!user || user.isDeleted) return res.status(401).json({ message: 'Invalid credentials' });
    if (user.isBanned) return res.status(403).json({ message: 'Account banned' });
    if (!user.isVerified) return res.status(403).json({ message: 'Email not verified' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    const refreshToken = signRefreshToken({ id: user._id });

    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) user.refreshTokens = user.refreshTokens.slice(-5);
    user.lastActiveAt = new Date();
    await user.save();

    const redis = getRedis();
    if (redis) await redis.set(`session:${user._id}`, '1', 'EX', 60 * 60 * 24);

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        department: user.department,
        year: user.year
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'Refresh token required' });

    const decoded = verifyRefresh(refreshToken);
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = signAccessToken({ id: user._id, role: user.role });
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (user) {
      user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
      await user.save();
    }
    const redis = getRedis();
    if (redis) await redis.del(`session:${req.user._id}`);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};
