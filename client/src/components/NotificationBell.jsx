import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useSocket } from '../context/SocketContext.jsx';
import { timeAgo } from '../utils/format.js';

export default function NotificationBell() {
  const { socket } = useSocket();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = () =>
    api.get('/notifications').then((r) => {
      setItems(r.data.items);
      setUnread(r.data.unread);
    });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = () => {
      setUnread((u) => u + 1);
      load();
    };
    socket.on('newNotification', onNew);
    return () => socket.off('newNotification', onNew);
  }, [socket]);

  const markAll = async () => {
    await api.put('/notifications/read-all');
    load();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative px-3 py-2 rounded-lg hover:bg-slate-100"
        aria-label="Notifications"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg z-40">
          <div className="flex items-center justify-between p-3 border-b">
            <strong>Notifications</strong>
            <button onClick={markAll} className="text-xs text-brand-600 hover:underline">
              Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 && <div className="p-4 text-sm text-slate-500">No notifications</div>}
            {items.map((n) => (
              <Link
                key={n._id}
                to={n.link || '#'}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 border-b hover:bg-slate-50 ${n.read ? '' : 'bg-brand-50'}`}
              >
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-xs text-slate-500">{n.body}</div>
                <div className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
