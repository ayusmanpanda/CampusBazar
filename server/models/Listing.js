const mongoose = require('mongoose');

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Furniture', 'Services', 'Other'];
const CONDITIONS = ['New', 'Good', 'Fair'];

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, maxlength: 4000 },
    price: { type: Number, required: true, min: 0 },
    images: {
      type: [String],
      validate: [(arr) => arr.length <= 5, 'Maximum 5 images allowed']
    },
    category: { type: String, enum: CATEGORIES, required: true },
    condition: { type: String, enum: CONDITIONS, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['active', 'sold', 'expired'], default: 'active', index: true },
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', description: 'text' });
listingSchema.index({ category: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Listing', listingSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.CONDITIONS = CONDITIONS;
