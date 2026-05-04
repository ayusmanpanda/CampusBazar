import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const CATEGORIES = ['Books', 'Electronics', 'Clothing', 'Furniture', 'Services', 'Other'];
const CONDITIONS = ['New', 'Good', 'Fair'];

export default function PostListing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Books',
    condition: 'Good'
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (files.length > 5) return toast.error('Max 5 images');
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      files.forEach((f) => fd.append('images', f));
      const { data } = await api.post('/listings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Listing posted');
      navigate(`/listing/${data._id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Post a new listing</h1>
      <form onSubmit={onSubmit} className="card space-y-3">
        <input
          className="input"
          placeholder="Title (e.g. CLRS textbook 3rd edition)"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="input"
          placeholder="Description"
          rows={5}
          required
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid sm:grid-cols-3 gap-3">
          <input
            className="input"
            placeholder="Price (₹)"
            type="number"
            min="0"
            required
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select
            className="input"
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
          >
            {CONDITIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1 text-slate-600">Images (up to 5)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files).slice(0, 5))}
          />
          {files.length > 0 && (
            <div className="flex gap-2 mt-2">
              {files.map((f, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="w-16 h-16 rounded object-cover border"
                />
              ))}
            </div>
          )}
        </div>
        <button className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Posting…' : 'Post Listing'}
        </button>
      </form>
    </div>
  );
}
