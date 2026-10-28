import { NavLink, useNavigate } from 'react-router-dom';
import { Compass, Gavel, PlusSquare, Heart, Package, BookMarked, Bell, Bot, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { path: '/', icon: Compass, label: 'Discover', end: true },
  { path: '/auctions', icon: Gavel, label: 'Browse Auctions' },
  { path: '/sell', icon: PlusSquare, label: 'Sell an Item' },
  { path: '/my-bids', icon: Heart, label: 'My Bids' },
  { path: '/my-listings', icon: Package, label: 'My Listings' },
  { path: '/saved-searches', icon: BookMarked, label: 'Saved Searches' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/assistant', icon: Bot, label: 'AI Assistant' },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    onClose?.();
  };

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'white', borderRight: '1px solid #F0F0EE' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #F0F0EE' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#287A52', margin: 0 }}>CampusBid</h1>
          <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.15rem' }}>Good finds. Fair bids.</p>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: '0.375rem' }}>
            <X size={20} color="#6B7280" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
        {NAV.map(({ path, icon: Icon, label, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            onClick={onClose}
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            style={{ marginBottom: '0.125rem' }}
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div style={{ padding: '1rem', borderTop: '1px solid #F0F0EE' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '2.25rem', height: '2.25rem', borderRadius: '9999px', background: '#287A52', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
              {user.avatar || user.name?.[0]}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#20231F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
              <p style={{ fontSize: '0.7rem', color: '#9CA3AF', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.college || user.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: 'none', background: 'none', color: '#EF4444', fontSize: '0.875rem', cursor: 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEF2F2'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
