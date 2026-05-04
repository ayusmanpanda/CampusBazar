import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { inr, timeAgo } from '../utils/format.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [active, setActive] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/listings/${id}`).then((r) => setListing(r.data));
    api.post(`/listings/${id}/views`).catch(() => {});
  }, [id]);

  const startChat = async () => {
    if (!user) return navigate('/login');
    try {
      const { data } = await api.post('/chats', { listingId: id });
      navigate(`/chats/${data._id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not start chat');
    }
  };

  const submitReport = async () => {
    try {
      await api.post('/reports', {
        targetType: 'listing',
        targetId: id,
        reason,
        description
      });
      toast.success('Report submitted');
      setReportOpen(false);
      setReason('');
      setDescription('');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to report');
    }
  };

  if (!listing) return <div className="p-8">Loading…</div>;
  const seller = listing.seller || {};
  const isOwn = user && (user.id === seller._id || user._id === seller._id);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <div className="aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden mb-3">
          <img
            src={listing.images?.[active] || 'https://placehold.co/600x450?text=No+Image'}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        </div>
        {listing.images?.length > 1 && (
          <div className="flex gap-2">
            {listing.images.map((src, i) => (
              <button
                key={src}
                onClick={() => setActive(i)}
                className={`w-16 h-16 rounded overflow-hidden border-2 ${
                  active === i ? 'border-brand-600' : 'border-transparent'
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <div className="text-3xl font-bold text-brand-600 mt-2">{inr(listing.price)}</div>
        <div className="flex gap-2 mt-2 text-sm text-slate-500">
          <span className="badge bg-slate-100">{listing.category}</span>
          <span className="badge bg-slate-100">{listing.condition}</span>
          <span>· {timeAgo(listing.createdAt)} · {listing.views} views</span>
        </div>

        <p className="mt-4 whitespace-pre-line">{listing.description}</p>

        <div className="card mt-4">
          <div className="flex items-center gap-3">
            <img
              src={seller.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.name || 'U')}`}
              className="w-12 h-12 rounded-full"
              alt=""
            />
            <div className="flex-1">
              <Link to={`/profile/${seller._id}`} className="font-semibold hover:underline">
                {seller.name}
              </Link>
              <div className="text-xs text-slate-500">
                {seller.department} · Year {seller.year} · ★ {(seller.rating || 0).toFixed(1)} ({seller.totalReviews || 0})
              </div>
            </div>
          </div>
        </div>

        {!isOwn && listing.status === 'active' && (
          <div className="mt-4 flex gap-2">
            <button onClick={startChat} className="btn-primary flex-1">Chat / Make Offer</button>
            <button onClick={() => setReportOpen(true)} className="btn-secondary">Report</button>
          </div>
        )}

        {listing.status !== 'active' && (
          <div className="mt-4 p-3 bg-amber-50 text-amber-700 rounded-lg">
            This listing is {listing.status}.
          </div>
        )}

        {reportOpen && (
          <div className="card mt-4">
            <h3 className="font-semibold mb-2">Report this listing</h3>
            <input
              className="input mb-2"
              placeholder="Reason (e.g. Fraud, Inappropriate)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <textarea
              className="input"
              placeholder="Description (optional)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <button onClick={submitReport} className="btn-primary" disabled={!reason}>Submit</button>
              <button onClick={() => setReportOpen(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
