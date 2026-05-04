import { useEffect, useState } from 'react';
import api from '../utils/api';
import ListingCard from '../components/ListingCard.jsx';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Furniture', 'Services', 'Other'];
const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'popular', label: 'Most Viewed' }
];

export default function Home() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ q: '', category: '', sort: 'recent' });

  useEffect(() => {
    setLoading(true);
    api
      .get('/listings', { params: { ...filters, page, limit: 20 } })
      .then((r) => {
        setItems(r.data.items);
        setPages(r.data.pagination.pages);
      })
      .finally(() => setLoading(false));
  }, [filters, page]);

  const change = (patch) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  return (
    <div>
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Search books, electronics, services…"
            value={filters.q}
            onChange={(e) => change({ q: e.target.value })}
          />
          <select
            className="input sm:w-48"
            value={filters.category}
            onChange={(e) => change({ category: e.target.value })}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="input sm:w-56"
            value={filters.sort}
            onChange={(e) => change({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Loading listings…</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-slate-500">No listings found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((l) => (
            <ListingCard key={l._id} listing={l} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-secondary disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-2">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
