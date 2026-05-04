import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import ListingCard from '../components/ListingCard.jsx';

export default function Profile() {
  const { userId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get(`/users/${userId}`).then((r) => setData(r.data));
  }, [userId]);

  if (!data) return <div className="p-8">Loading…</div>;
  const { user, listings } = data;
  return (
    <div>
      <div className="card flex items-center gap-4 mb-4">
        <img
          src={user.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`}
          alt=""
          className="w-20 h-20 rounded-full"
        />
        <div>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <div className="text-slate-500">{user.department} · Year {user.year}</div>
          <div className="mt-1">★ {(user.rating || 0).toFixed(1)} ({user.totalReviews || 0} reviews)</div>
        </div>
      </div>
      <h2 className="font-semibold mb-3">Active listings</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {listings.map((l) => (
          <ListingCard key={l._id} listing={{ ...l, seller: user }} />
        ))}
      </div>
    </div>
  );
}
