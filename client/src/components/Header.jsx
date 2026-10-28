import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ onMenuToggle, notifCount = 0 }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/auctions?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header style={{
      height: '3.5rem',
      background: 'white',
      borderBottom: '1px solid #F0F0EE',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0 1.25rem',
      position: 'sticky',
      top: 0,
      zIndex: 20,
    }}>
      {/* Mobile menu */}
      <button onClick={onMenuToggle} className="lg:hidden" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.375rem', borderRadius: '0.375rem' }}>
        <Menu size={20} color="#6B7280" />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: '32rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search auctions..."
            style={{ width: '100%', paddingLeft: '2.25rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', fontSize: '0.875rem', border: '1.5px solid #E5E7EB', borderRadius: '0.5rem', background: '#F8F7F4', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      </form>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
        <button onClick={() => navigate('/notifications')} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.5rem' }}>
          <Bell size={18} color="#6B7280" />
          {notifCount > 0 && (
            <span style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', width: '1rem', height: '1rem', background: '#EF4444', color: 'white', fontSize: '0.65rem', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>
        {user && (
          <div
            onClick={() => navigate('/my-listings')}
            style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: '#287A52', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
          >
            {user.avatar || user.name?.[0]}
          </div>
        )}
      </div>
    </header>
  );
}
