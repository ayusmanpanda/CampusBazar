const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, default: '' },
    type: { type: String, enum: ['text', 'offer'], default: 'text' },
    offerPrice: { type: Number },
    offerStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'countered'],
      default: 'pending'
    },
    readBy: { type: [mongoose.Schema.Types.ObjectId], default: [] }
  },
  { timestamps: true }
);

const chatRoomSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true, index: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    messages: { type: [messageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

chatRoomSchema.index({ listing: 1, buyer: 1, seller: 1 }, { unique: true });
// TTL: delete chat room if no message for 60 days
chatRoomSchema.index({ lastMessageAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 60 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
