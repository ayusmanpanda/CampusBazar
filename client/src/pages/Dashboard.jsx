import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import ListingCard from '../components/ListingCard.jsx';
import { inr } from '../utils/format.js';

export default function Dashboard() {
  const [tab, setTab] = useState('listings');
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get('/listings/me/mine').then((r) => setItems(r.data.items));
  }, []);

  const remove = async (id) => {
    if (!confirm('Delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      setItems((arr) => arr.filter((l) => l._id !== id));
      toast.success('Deleted');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const markSold = async (id) => {
    try {
      await api.put(`/listings/${id}`, { status: 'sold' });
      setItems((arr) => arr.map((l) => (l._id === id ? { ...l, status: 'sold' } : l)));
      toast.success('Marked as sold');
    } catch (e) {
      toast.error('Failed');
    }
  };

  const stats = {
    active: items.filter((i) => i.status === 'active').length,
    sold: items.filter((i) => i.status === 'sold').length,
    revenue: items.filter((i) => i.status === 'sold').reduce((s, i) => s + i.price, 0)
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold">{stats.active}</div>
          <div className="text-xs text-slate-500">Active listings</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold">{stats.sold}</div>
          <div className="text-xs text-slate-500">Items sold</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold">{inr(stats.revenue)}</div>
          <div className="text-xs text-slate-500">Total earned</div>
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        {['listings'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? 'btn-primary' : 'btn-secondary'}
          >
            My listings
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((l) => (
          <div key={l._id}>
            <ListingCard listing={l} />
            <div className="flex gap-2 mt-2">
              {l.status === 'active' && (
                <button onClick={() => markSold(l._id)} className="btn-secondary text-xs">Mark sold</button>
              )}
              <button onClick={() => remove(l._id)} className="btn-danger text-xs">Delete</button>
              <span className="ml-auto badge bg-slate-100">{l.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
