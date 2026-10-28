import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bike, Calculator, BookOpen, Laptop, Headphones, Backpack, LayoutGrid, Clock, Sparkles, ArrowRight, Info } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import AuctionCard from '../components/AuctionCard';

const CATS = [
  { name: 'All', icon: LayoutGrid },
  { name: 'Cycles', icon: Bike },
  { name: 'Calculators', icon: Calculator },
  { name: 'Books', icon: BookOpen },
  { name: 'Electronics', icon: Laptop },
  { name: 'Accessories', icon: Backpack },
];

export default function DiscoverPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.getAuctions().then(setAuctions).catch(console.error).finally(() => setLoading(false));
  }, []);

  const active = auctions.filter(a => a.status === 'ACTIVE');
  const featured = active.filter(a => a.featured).slice(0, 4);
  const endingSoon = [...active].sort((a, b) => new Date(a.closingTime) - new Date(b.closingTime)).slice(0, 4);
  const recent = [...auctions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/auctions?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Hero banner */}
      <div style={{ background: '#287A52', borderRadius: '1rem', padding: '2rem', color: 'white' }}>
        <p style={{ color: '#A7F3D0', fontSize: '0.8rem', fontWeight: 500, marginBottom: '0.25rem' }}>
          Welcome back{user ? `, ${user.name.split(' ')[0]}` : ''}!
        </p>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.375rem' }}>Find your next great deal</h2>
        <p style={{ color: '#D1FAE5', fontSize: '0.875rem', margin: '0 0 1.5rem' }}>Good finds. Fair bids. New beginnings.</p>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', maxWidth: '36rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search for a bicycle, calculator, laptop..." style={{ width: '100%', paddingLeft: '2.25rem', paddingRight: '1rem', paddingTop: '0.75rem', paddingBottom: '0.75rem', borderRadius: '0.75rem', border: 'none', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button type="submit" style={{ background: 'white', color: '#287A52', fontWeight: 600, padding: '0 1.25rem', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            Search
          </button>
        </form>
      </div>

      {/* Categories */}
      <div>
        <h3 style={{ fontWeight: 600, color: '#20231F', marginBottom: '0.75rem' }}>Browse by Category</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {CATS.map(({ name, icon: Icon }) => (
            <button key={name} onClick={() => navigate(name === 'All' ? '/auctions' : `/auctions?category=${name}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1.5px solid #E5E7EB', background: 'white', fontSize: '0.875rem', fontWeight: 500, color: '#4B5563', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E4F3E8'; e.currentTarget.style.color = '#287A52'; e.currentTarget.style.borderColor = '#287A52'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#4B5563'; e.currentTarget.style.borderColor = '#E5E7EB'; }}
            >
              <Icon size={15} /> {name}
            </button>
          ))}
        </div>
      </div>

      {/* Featured */}
      {!loading && featured.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontWeight: 600, color: '#20231F', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Sparkles size={16} color="#287A52" /> Featured Auctions
            </h3>
            <button onClick={() => navigate('/auctions')} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.875rem', color: '#287A52', background: 'none', border: 'none', cursor: 'pointer' }}>
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {featured.map(a => <AuctionCard key={a.id} auction={a} />)}
          </div>
        </div>
      )}

      {/* Ending Soon */}
      {!loading && endingSoon.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 600, color: '#20231F', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Clock size={16} color="#EF4444" /> Ending Soon
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {endingSoon.map(a => <AuctionCard key={a.id} auction={a} />)}
          </div>
        </div>
      )}

      {/* Recent */}
      {!loading && recent.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 600, color: '#20231F', marginBottom: '0.75rem' }}>Recently Listed</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {recent.map(a => <AuctionCard key={a.id} auction={a} />)}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ height: '18rem', borderRadius: '0.75rem', background: '#E5E7EB', animation: 'pulse 2s infinite' }} />)}
        </div>
      )}

      {/* How it works */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontWeight: 600, color: '#20231F', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Info size={16} color="#287A52" /> How CampusBid Works
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { step: '1', title: 'Browse Listings', desc: 'Explore items listed by graduating seniors across all categories.' },
            { step: '2', title: 'Place Fair Bids', desc: 'Bid transparently with enforced minimum increments and anti-sniping protection.' },
            { step: '3', title: 'Win & Pickup', desc: 'Seller approves the winning bid and arranges a safe campus handover.' },
          ].map(({ step, title, desc }) => (
            <div key={step} style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '9999px', background: '#E4F3E8', color: '#287A52', fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {step}
              </div>
              <div>
                <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#20231F', margin: '0 0 0.25rem' }}>{title}</h4>
                <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
