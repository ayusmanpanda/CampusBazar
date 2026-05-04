import { Link } from 'react-router-dom';
import { inr } from '../utils/format.js';

const conditionColor = {
  New: 'bg-emerald-100 text-emerald-700',
  Good: 'bg-amber-100 text-amber-700',
  Fair: 'bg-rose-100 text-rose-700'
};

export default function ListingCard({ listing }) {
  const cover = listing.images?.[0] || 'https://placehold.co/400x300?text=No+Image';
  const seller = listing.seller || {};
  return (
    <Link to={`/listing/${listing._id}`} className="card hover:shadow-md transition block">
      <div className="aspect-[4/3] bg-slate-100 rounded-lg overflow-hidden mb-3">
        <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
        <span className={`badge ${conditionColor[listing.condition] || 'bg-slate-100 text-slate-700'}`}>
          {listing.condition}
        </span>
      </div>
      <div className="text-brand-600 font-bold mt-1">{inr(listing.price)}</div>
      <div className="text-xs text-slate-500 mt-2 flex justify-between">
        <span>{seller.name || 'Seller'}</span>
        <span>★ {(seller.rating || 0).toFixed(1)} ({seller.totalReviews || 0})</span>
      </div>
    </Link>
  );
}
