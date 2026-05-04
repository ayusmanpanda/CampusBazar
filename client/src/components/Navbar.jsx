import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-brand-600">CampusBazaar</Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link to="/post" className="btn-primary">+ Post</Link>
              <Link to="/chats" className="btn-secondary">Chats</Link>
              <Link to="/dashboard" className="btn-secondary">Dashboard</Link>
              {user.role === 'admin' && <Link to="/admin" className="btn-secondary">Admin</Link>}
              <NotificationBell />
              <div className="hidden sm:flex items-center gap-2">
                <Link to={`/profile/${user.id || user._id}`} className="text-sm text-slate-600 hover:underline">{user.name}</Link>
              </div>
              <button onClick={handleLogout} className="btn-secondary text-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/signup" className="btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
