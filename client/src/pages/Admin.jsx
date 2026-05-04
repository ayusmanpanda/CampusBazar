import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import AdminTable from '../components/AdminTable.jsx';
import { timeAgo } from '../utils/format.js';

export default function Admin() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    if (tab === 'users') api.get('/admin/users').then((r) => setUsers(r.data.items));
    if (tab === 'listings') api.get('/admin/listings').then((r) => setListings(r.data.items));
    if (tab === 'reports') api.get('/admin/reports').then((r) => setReports(r.data.items));
  }, [tab]);

  const banUser = async (id, isBanned) => {
    const reason = isBanned ? prompt('Ban reason?') || '' : '';
    await api.put(`/admin/users/${id}/ban`, { isBanned, reason });
    setUsers((arr) => arr.map((u) => (u._id === id ? { ...u, isBanned, banReason: reason } : u)));
    toast.success(isBanned ? 'User banned' : 'User unbanned');
  };

  const updateReport = async (id, status) => {
    await api.put(`/admin/reports/${id}`, { status });
    setReports((arr) => arr.map((r) => (r._id === id ? { ...r, status } : r)));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <div className="flex gap-2 mb-4">
        {['users', 'listings', 'reports'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={tab === t ? 'btn-primary' : 'btn-secondary'}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <AdminTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'role', label: 'Role' },
            {
              key: 'status',
              label: 'Status',
              render: (u) =>
                u.isBanned ? <span className="badge bg-rose-100 text-rose-700">Banned</span> : <span className="badge bg-emerald-100 text-emerald-700">Active</span>
            },
            { key: 'createdAt', label: 'Joined', render: (u) => timeAgo(u.createdAt) }
          ]}
          rows={users}
          actions={(u) => (
            <button
              onClick={() => banUser(u._id, !u.isBanned)}
              className={u.isBanned ? 'btn-secondary text-xs' : 'btn-danger text-xs'}
            >
              {u.isBanned ? 'Unban' : 'Ban'}
            </button>
          )}
        />
      )}

      {tab === 'listings' && (
        <AdminTable
          columns={[
            { key: 'title', label: 'Title' },
            { key: 'price', label: 'Price', render: (l) => `₹${l.price}` },
            { key: 'category', label: 'Category' },
            { key: 'status', label: 'Status' },
            { key: 'seller', label: 'Seller', render: (l) => l.seller?.name }
          ]}
          rows={listings}
        />
      )}

      {tab === 'reports' && (
        <AdminTable
          columns={[
            { key: 'targetType', label: 'Target' },
            { key: 'reason', label: 'Reason' },
            { key: 'reporter', label: 'Reporter', render: (r) => r.reporter?.name },
            { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'When', render: (r) => timeAgo(r.createdAt) }
          ]}
          rows={reports}
          actions={(r) => (
            <>
              {r.status !== 'reviewed' && (
                <button onClick={() => updateReport(r._id, 'reviewed')} className="btn-secondary text-xs">
                  Review
                </button>
              )}
              {r.status !== 'resolved' && (
                <button onClick={() => updateReport(r._id, 'resolved')} className="btn-primary text-xs">
                  Resolve
                </button>
              )}
            </>
          )}
        />
      )}
    </div>
  );
}
