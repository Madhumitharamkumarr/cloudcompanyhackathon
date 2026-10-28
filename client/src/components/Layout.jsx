import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const load = () =>
      api.getNotifications()
        .then(ns => setNotifCount(ns.filter(n => !n.read).length))
        .catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8F7F4', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <div style={{ display: 'none', width: '16rem', flexShrink: 0, flexDirection: 'column' }} className="desktop-sidebar">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 30, display: 'flex' }}>
          <div style={{ width: '16rem', flexShrink: 0, boxShadow: '4px 0 20px rgba(0,0,0,0.15)' }}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)' }} onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} notifCount={notifCount} />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.5rem 1.25rem' }}>
            <Outlet />
          </div>
        </main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .desktop-sidebar { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
