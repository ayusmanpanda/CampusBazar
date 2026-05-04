import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { timeAgo, inr } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Chats() {
  const [items, setItems] = useState([]);
  const { user } = useAuth();
  const meId = user?.id || user?._id;

  useEffect(() => {
    api.get('/chats').then((r) => setItems(r.data.items));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Your chats</h1>
      {items.length === 0 && <div className="card text-slate-500">No chats yet.</div>}
      <div className="space-y-2">
        {items.map((c) => {
          const other = String(c.buyer?._id) === String(meId) ? c.seller : c.buyer;
          return (
            <Link key={c._id} to={`/chats/${c._id}`} className="card flex items-center gap-3 hover:shadow-md">
              <img
                src={c.listing?.images?.[0] || 'https://placehold.co/60'}
                className="w-14 h-14 rounded-lg object-cover"
                alt=""
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <div className="font-semibold truncate">{c.listing?.title}</div>
                  <div className="text-xs text-slate-500">{timeAgo(c.lastMessageAt)}</div>
                </div>
                <div className="text-sm text-slate-500 truncate">
                  {other?.name} · {inr(c.listing?.price)}
                </div>
                <div className="text-sm text-slate-700 truncate">
                  {c.lastMessage?.type === 'offer' ? `Offer: ${inr(c.lastMessage.offerPrice)}` : c.lastMessage?.text}
                </div>
              </div>
              {c.unreadCount > 0 && (
                <span className="badge bg-brand-600 text-white">{c.unreadCount}</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
