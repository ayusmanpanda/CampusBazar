import { useEffect, useRef, useState } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api';
import OfferCard from './OfferCard.jsx';
import { timeAgo } from '../utils/format.js';

export default function ChatWindow({ chatRoomId }) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [text, setText] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [showOffer, setShowOffer] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const endRef = useRef();
  const typingTimer = useRef();

  const meId = user?.id || user?._id;

  // Load room messages
  useEffect(() => {
    let active = true;
    api.get(`/chats/${chatRoomId}/messages`).then((res) => {
      if (active) setRoom(res.data);
    });
    return () => {
      active = false;
    };
  }, [chatRoomId]);

  // Socket subscriptions
  useEffect(() => {
    if (!socket || !chatRoomId) return;
    socket.emit('joinRoom', chatRoomId);

    const onNew = ({ chatRoomId: rid, message }) => {
      if (rid !== chatRoomId) return;
      setRoom((r) => (r ? { ...r, messages: [...r.messages, message] } : r));
    };
    const onOfferUpdated = ({ chatRoomId: rid, offerId, status, counterMessage }) => {
      if (rid !== chatRoomId) return;
      setRoom((r) => {
        if (!r) return r;
        const messages = r.messages.map((m) =>
          String(m._id) === String(offerId) ? { ...m, offerStatus: status } : m
        );
        if (counterMessage) messages.push(counterMessage);
        return { ...r, messages };
      });
    };
    const onTyping = ({ chatRoomId: rid, userId, isTyping }) => {
      if (rid !== chatRoomId) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    socket.on('newMessage', onNew);
    socket.on('offerUpdated', onOfferUpdated);
    socket.on('typing', onTyping);
    return () => {
      socket.emit('leaveRoom', chatRoomId);
      socket.off('newMessage', onNew);
      socket.off('offerUpdated', onOfferUpdated);
      socket.off('typing', onTyping);
    };
  }, [socket, chatRoomId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages?.length]);

  const sendText = () => {
    if (!text.trim() || !socket) return;
    socket.emit('sendMessage', { chatRoomId, text });
    setText('');
  };

  const sendOffer = () => {
    if (!offerPrice || !socket) return;
    socket.emit('sendOffer', { chatRoomId, offerPrice: Number(offerPrice) });
    setOfferPrice('');
    setShowOffer(false);
  };

  const respondOffer = (offerId, action, counterPrice) => {
    socket.emit('offerResponse', { chatRoomId, offerId, action, counterPrice });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    socket?.emit('typing', { chatRoomId, isTyping: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket?.emit('typing', { chatRoomId, isTyping: false });
    }, 1500);
  };

  if (!room) return <div className="p-6">Loading…</div>;

  const otherTyping = [...typingUsers].some((id) => id !== meId);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-xl border">
      <div className="p-3 border-b flex items-center gap-3">
        <img
          src={room.listing?.images?.[0] || 'https://placehold.co/60'}
          className="w-10 h-10 rounded object-cover"
          alt=""
        />
        <div>
          <div className="font-semibold">{room.listing?.title}</div>
          <div className="text-xs text-slate-500">
            with {String(room.buyer?._id) === String(meId) ? room.seller?.name : room.buyer?.name}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {room.messages.map((m) => {
          const isOwn = String(m.sender) === String(meId);
          if (m.type === 'offer') {
            return (
              <OfferCard
                key={m._id}
                message={m}
                isOwn={isOwn}
                canRespond={!isOwn}
                onRespond={(action, counterPrice) => respondOffer(m._id, action, counterPrice)}
              />
            );
          }
          return (
            <div key={m._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] px-3 py-2 rounded-2xl ${
                  isOwn ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                <div>{m.text}</div>
                <div className="text-[10px] mt-1 opacity-70">{timeAgo(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        {otherTyping && <div className="text-xs text-slate-500">typing…</div>}
        <div ref={endRef} />
      </div>

      {showOffer && (
        <div className="p-3 border-t flex gap-2">
          <input
            type="number"
            value={offerPrice}
            onChange={(e) => setOfferPrice(e.target.value)}
            placeholder="Offer price"
            className="input"
          />
          <button onClick={sendOffer} className="btn-primary">Send Offer</button>
          <button onClick={() => setShowOffer(false)} className="btn-secondary">Cancel</button>
        </div>
      )}

      <div className="p-3 border-t flex gap-2">
        <button onClick={() => setShowOffer((v) => !v)} className="btn-secondary">₹</button>
        <input
          value={text}
          onChange={handleTyping}
          onKeyDown={(e) => e.key === 'Enter' && sendText()}
          placeholder="Type a message…"
          className="input"
        />
        <button onClick={sendText} className="btn-primary">Send</button>
      </div>
    </div>
  );
}
