const Listing = require('../models/Listing');
const Notification = require('../models/Notification');

// GET /api/listings — filter, search, sort, paginate
exports.list = async (req, res, next) => {
  try {
    const {
      q,
      category,
      condition,
      minPrice,
      maxPrice,
      sort = 'recent',
      page = 1,
      limit = 20
    } = req.query;

    const filter = { status: 'active' };
    if (category) filter.category = category;
    if (condition) filter.condition = condition;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (q) filter.$text = { $search: q };

    const sortMap = {
      recent: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      popular: { views: -1 }
    };
    const sortBy = sortMap[sort] || sortMap.recent;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Listing.find(filter)
        .populate('seller', 'name profilePhoto rating totalReviews department year')
        .sort(sortBy)
        .skip(skip)
        .limit(limitNum),
      Listing.countDocuments(filter)
    ]);

    res.json({
      items,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id).populate(
      'seller',
      'name profilePhoto rating totalReviews department year email'
    );
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, price, category, condition } = req.body;
    const images = (req.files || []).map((f) => f.path);
    const listing = await Listing.create({
      title,
      description,
      price: Number(price),
      images,
      category,
      condition,
      seller: req.user._id
    });
    res.status(201).json(listing);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (String(listing.seller) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }

    const allowed = ['title', 'description', 'price', 'category', 'condition', 'status'];
    for (const key of allowed) if (key in req.body) listing[key] = req.body[key];
    if (req.files && req.files.length) {
      const newImages = req.files.map((f) => f.path);
      listing.images = [...listing.images, ...newImages].slice(0, 5);
    }
    await listing.save();
    res.json(listing);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (String(listing.seller) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not allowed' });
    }
    await listing.deleteOne();
    res.json({ message: 'Listing deleted' });
  } catch (err) {
    next(err);
  }
};

exports.incrementView = async (req, res, next) => {
  try {
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ message: 'view counted' });
  } catch (err) {
    next(err);
  }
};

exports.myListings = async (req, res, next) => {
  try {
    const items = await Listing.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};
