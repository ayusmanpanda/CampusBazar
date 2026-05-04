const ChatRoom = require('../models/Chat');
const Listing = require('../models/Listing');
const Notification = require('../models/Notification');

// Create or fetch the chat room between current user (buyer) and a listing's seller.
exports.createOrGetRoom = async (req, res, next) => {
  try {
    const { listingId } = req.body;
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (String(listing.seller) === String(req.user._id)) {
      return res.status(400).json({ message: "You can't chat with yourself about your own listing" });
    }

    let room = await ChatRoom.findOne({
      listing: listing._id,
      buyer: req.user._id,
      seller: listing.seller
    });
    if (!room) {
      room = await ChatRoom.create({
        listing: listing._id,
        buyer: req.user._id,
        seller: listing.seller,
        messages: []
      });
    }

    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
};

exports.myChats = async (req, res, next) => {
  try {
    const uid = req.user._id;
    const rooms = await ChatRoom.find({ $or: [{ buyer: uid }, { seller: uid }] })
      .sort({ lastMessageAt: -1 })
      .populate('listing', 'title price images status')
      .populate('buyer', 'name profilePhoto')
      .populate('seller', 'name profilePhoto')
      .lean();

    const summaries = rooms.map((r) => {
      const last = r.messages[r.messages.length - 1] || null;
      return {
        _id: r._id,
        listing: r.listing,
        buyer: r.buyer,
        seller: r.seller,
        lastMessage: last,
        lastMessageAt: r.lastMessageAt,
        unreadCount: r.messages.filter(
          (m) => !m.readBy?.some((id) => String(id) === String(uid)) && String(m.sender) !== String(uid)
        ).length
      };
    });

    res.json({ items: summaries });
  } catch (err) {
    next(err);
  }
};

exports.getMessages = async (req, res, next) => {
  try {
    const room = await ChatRoom.findById(req.params.id)
      .populate('listing', 'title price images status seller')
      .populate('buyer', 'name profilePhoto')
      .populate('seller', 'name profilePhoto');
    if (!room) return res.status(404).json({ message: 'Chat room not found' });

    const uid = String(req.user._id);
    if (String(room.buyer._id) !== uid && String(room.seller._id) !== uid) {
      return res.status(403).json({ message: 'Not a participant' });
    }

    // mark unread messages as read by current user
    let dirty = false;
    room.messages.forEach((m) => {
      if (!m.readBy?.some((id) => String(id) === uid)) {
        m.readBy.push(req.user._id);
        dirty = true;
      }
    });
    if (dirty) await room.save();

    res.json(room);
  } catch (err) {
    next(err);
  }
};

// POST /api/chats/:id/offer — send an offer message
exports.sendOffer = async (req, res, next) => {
  try {
    const { offerPrice, text } = req.body;
    const room = await ChatRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Chat room not found' });

    const uid = String(req.user._id);
    if (String(room.buyer) !== uid && String(room.seller) !== uid) {
      return res.status(403).json({ message: 'Not a participant' });
    }

    const message = {
      sender: req.user._id,
      type: 'offer',
      text: text || `Offer: ₹${offerPrice}`,
      offerPrice: Number(offerPrice),
      offerStatus: 'pending',
      readBy: [req.user._id]
    };
    room.messages.push(message);
    room.lastMessageAt = new Date();
    await room.save();

    const recipient = String(room.buyer) === uid ? room.seller : room.buyer;
    await Notification.create({
      user: recipient,
      type: 'offer',
      title: 'New offer',
      body: `Offer of ₹${offerPrice} on your listing`,
      link: `/chats/${room._id}`
    });

    const created = room.messages[room.messages.length - 1];
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

// PUT /api/chats/:id/offer/:offerId — accept / reject / counter
exports.respondOffer = async (req, res, next) => {
  try {
    const { action, counterPrice } = req.body;
    if (!['accept', 'reject', 'counter'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const room = await ChatRoom.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Chat room not found' });

    const offer = room.messages.id(req.params.offerId);
    if (!offer || offer.type !== 'offer') {
      return res.status(404).json({ message: 'Offer not found' });
    }

    const uid = String(req.user._id);
    if (String(offer.sender) === uid) {
      return res.status(400).json({ message: "You can't respond to your own offer" });
    }
    if (String(room.buyer) !== uid && String(room.seller) !== uid) {
      return res.status(403).json({ message: 'Not a participant' });
    }
    if (offer.offerStatus !== 'pending') {
      return res.status(400).json({ message: `Offer already ${offer.offerStatus}` });
    }

    let newMessage = null;
    if (action === 'accept') {
      offer.offerStatus = 'accepted';
      // mark listing sold
      await Listing.findByIdAndUpdate(room.listing, { status: 'sold' });
    } else if (action === 'reject') {
      offer.offerStatus = 'rejected';
    } else if (action === 'counter') {
      offer.offerStatus = 'countered';
      room.messages.push({
        sender: req.user._id,
        type: 'offer',
        text: `Counter: ₹${counterPrice}`,
        offerPrice: Number(counterPrice),
        offerStatus: 'pending',
        readBy: [req.user._id]
      });
      newMessage = room.messages[room.messages.length - 1];
    }

    room.lastMessageAt = new Date();
    await room.save();

    const recipient = String(room.buyer) === uid ? room.seller : room.buyer;
    await Notification.create({
      user: recipient,
      type: 'offer_response',
      title: `Offer ${offer.offerStatus}`,
      body: `Your offer was ${offer.offerStatus}`,
      link: `/chats/${room._id}`
    });

    res.json({ offer, counterMessage: newMessage });
  } catch (err) {
    next(err);
  }
};
