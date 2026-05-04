const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    department: { type: String, default: '' },
    year: { type: Number, min: 1, max: 6, default: 1 },
    profilePhoto: { type: String, default: '' },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },

    isVerified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },

    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: '' },
    reportCount: { type: Number, default: 0 },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },

    lastActiveAt: { type: Date, default: Date.now },

    refreshTokens: { type: [String], default: [], select: false }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ lastActiveAt: 1 });

module.exports = mongoose.model('User', userSchema);
