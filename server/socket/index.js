const { verifyAccess } = require('../utils/jwt');
const ChatRoom = require('../models/Chat');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Map<userId, Set<socketId>> for online presence + targeted notifications.
const online = new Map();

function addSocket(userId, socketId) {
  if (!online.has(userId)) online.set(userId, new Set());
  online.get(userId).add(socketId);
}
function removeSocket(userId, socketId) {
  const set = online.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) online.delete(userId);
}

function setupSocket(io) {
  // JWT handshake auth — token sent via auth.token by the client
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Missing token'));
      const decoded = verifyAccess(token);
      const user = await User.findById(decoded.id);
      if (!user || user.isBanned || user.isDeleted) return next(new Error('Unauthorized'));
      socket.userId = String(user._id);
      socket.userName = user.name;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    addSocket(userId, socket.id);
    socket.join(`user:${userId}`);

    // Broadcast presence
    io.emit('onlineStatus', { userId, online: true });

    socket.on('joinRoom', async (chatRoomId) => {
      try {
        const room = await ChatRoom.findById(chatRoomId).select('buyer seller');
        if (!room) return;
        if (String(room.buyer) !== userId && String(room.seller) !== userId) return;
        socket.join(`chat:${chatRoomId}`);
      } catch (e) {
        /* swallow */
      }
    });

    socket.on('leaveRoom', (chatRoomId) => {
      socket.leave(`chat:${chatRoomId}`);
    });

    socket.on('sendMessage', async ({ chatRoomId, text }) => {
      try {
        const room = await ChatRoom.findById(chatRoomId);
        if (!room) return;
        if (String(room.buyer) !== userId && String(room.seller) !== userId) return;

        const message = {
          sender: socket.userId,
          type: 'text',
          text: String(text || '').slice(0, 4000),
          readBy: [socket.userId]
        };
        room.messages.push(message);
        room.lastMessageAt = new Date();
        await room.save();

        const created = room.messages[room.messages.length - 1];
        io.to(`chat:${chatRoomId}`).emit('newMessage', { chatRoomId, message: created });

        const recipient = String(room.buyer) === userId ? room.seller : room.buyer;
        await Notification.create({
          user: recipient,
          type: 'message',
          title: 'New message',
          body: text?.slice(0, 80) || '',
          link: `/chats/${room._id}`
        });
        io.to(`user:${recipient}`).emit('newNotification', {
          type: 'message',
          chatRoomId,
          preview: text?.slice(0, 80) || ''
        });
      } catch (err) {
        console.error('sendMessage error', err.message);
      }
    });

    socket.on('sendOffer', async ({ chatRoomId, offerPrice, text }) => {
      try {
        const room = await ChatRoom.findById(chatRoomId);
        if (!room) return;
        if (String(room.buyer) !== userId && String(room.seller) !== userId) return;

        const message = {
          sender: socket.userId,
          type: 'offer',
          text: text || `Offer: ₹${offerPrice}`,
          offerPrice: Number(offerPrice),
          offerStatus: 'pending',
          readBy: [socket.userId]
        };
        room.messages.push(message);
        room.lastMessageAt = new Date();
        await room.save();

        const created = room.messages[room.messages.length - 1];
        io.to(`chat:${chatRoomId}`).emit('newMessage', { chatRoomId, message: created });

        const recipient = String(room.buyer) === userId ? room.seller : room.buyer;
        await Notification.create({
          user: recipient,
          type: 'offer',
          title: 'New offer',
          body: `Offer of ₹${offerPrice}`,
          link: `/chats/${room._id}`
        });
        io.to(`user:${recipient}`).emit('newNotification', {
          type: 'offer',
          chatRoomId,
          offerPrice
        });
      } catch (err) {
        console.error('sendOffer error', err.message);
      }
    });

    socket.on('offerResponse', async ({ chatRoomId, offerId, action, counterPrice }) => {
      try {
        const room = await ChatRoom.findById(chatRoomId);
        if (!room) return;
        const offer = room.messages.id(offerId);
        if (!offer || offer.type !== 'offer') return;
        if (String(offer.sender) === userId) return;
        if (String(room.buyer) !== userId && String(room.seller) !== userId) return;

        let countered = null;
        if (action === 'accept') offer.offerStatus = 'accepted';
        else if (action === 'reject') offer.offerStatus = 'rejected';
        else if (action === 'counter') {
          offer.offerStatus = 'countered';
          room.messages.push({
            sender: userId,
            type: 'offer',
            text: `Counter: ₹${counterPrice}`,
            offerPrice: Number(counterPrice),
            offerStatus: 'pending',
            readBy: [userId]
          });
          countered = room.messages[room.messages.length - 1];
        }

        room.lastMessageAt = new Date();
        await room.save();

        io.to(`chat:${chatRoomId}`).emit('offerUpdated', { chatRoomId, offerId, status: offer.offerStatus, counterMessage: countered });
      } catch (err) {
        console.error('offerResponse error', err.message);
      }
    });

    socket.on('typing', ({ chatRoomId, isTyping }) => {
      socket.to(`chat:${chatRoomId}`).emit('typing', { chatRoomId, userId, isTyping });
    });

    socket.on('disconnect', () => {
      removeSocket(userId, socket.id);
      if (!online.has(userId)) {
        io.emit('onlineStatus', { userId, online: false });
      }
    });
  });
}

module.exports = { setupSocket };
