import { useState } from 'react';
import { inr } from '../utils/format.js';

const statusColor = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
  countered: 'bg-sky-100 text-sky-700'
};

export default function OfferCard({ message, isOwn, canRespond, onRespond }) {
  const [counter, setCounter] = useState('');
  const [showCounter, setShowCounter] = useState(false);

  return (
    <div className={`max-w-md ${isOwn ? 'ml-auto' : ''}`}>
      <div className="card border-2 border-brand-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase font-semibold text-brand-600">Offer</span>
          <span className={`badge ${statusColor[message.offerStatus] || 'bg-slate-100'}`}>
            {message.offerStatus}
          </span>
        </div>
        <div className="text-2xl font-bold">{inr(message.offerPrice)}</div>
        {message.text && message.text !== `Offer: ₹${message.offerPrice}` && (
          <p className="text-sm text-slate-600 mt-1">{message.text}</p>
        )}

        {canRespond && message.offerStatus === 'pending' && !isOwn && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => onRespond('accept')} className="btn-primary text-sm">Accept</button>
            <button onClick={() => onRespond('reject')} className="btn-danger text-sm">Reject</button>
            <button onClick={() => setShowCounter((v) => !v)} className="btn-secondary text-sm">Counter</button>
          </div>
        )}
        {showCounter && (
          <div className="mt-3 flex gap-2">
            <input
              className="input"
              placeholder="Counter price"
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
              type="number"
            />
            <button
              className="btn-primary"
              onClick={() => {
                onRespond('counter', Number(counter));
                setShowCounter(false);
                setCounter('');
              }}
              disabled={!counter}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
