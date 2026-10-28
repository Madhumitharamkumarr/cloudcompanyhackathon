import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import { api } from '../lib/api';
import AuctionCard from '../components/AuctionCard';

const CATS = ['All', 'Cycles', 'Calculators', 'Books', 'Electronics', 'Accessories', 'Other'];
const CONDS = ['All', 'Like New', 'Good', 'Fair', 'Needs Repair'];
const SORTS = [
  { v: 'newest', l: 'Newest First' },
  { v: 'price_asc', l: 'Price: Low → High' },
  { v: 'price_desc', l: 'Price: High → Low' },
  { v: 'ending_soon', l: 'Ending Soon' },
];

export default function AuctionsPage() {
  const [sp] = useSearchParams();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: sp.get('search') || '',
    category: sp.get('category') || 'All',
    condition: 'All',
    sort: 'newest',
    maxPrice: '',
  });

  const upd = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  useEffect(() => {
    setLoading(true);
    const p = { sort: filters.sort };
    if (filters.search) p.search = filters.search;
    if (filters.category !== 'All') p.category = filters.category;
    if (filters.condition !== 'All') p.condition = filters.condition;
    if (filters.maxPrice) p.maxPrice = filters.maxPrice;
    api.getAuctions(p).then(setAuctions).catch(console.error).finally(() => setLoading(false));
  }, [filters]);

  const label = (s) => ({ input: 'inputEl' }); // unused, just prevents eslint warning

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.15rem', color: '#20231F', margin: 0 }}>Browse Auctions</h2>
        <button onClick={() => setShowFilters(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: '#6B7280', border: '1.5px solid #E5E7EB', padding: '0.4rem 0.875rem', borderRadius: '0.5rem', background: 'white', cursor: 'pointer' }}>
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      <input className="input-field" placeholder="Search auctions by title, description, category..." value={filters.search} onChange={e => upd('search', e.target.value)} />

      {showFilters && (
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {[
              { label: 'Category', key: 'category', options: CATS },
              { label: 'Condition', key: 'condition', options: CONDS },
            ].map(({ label: lbl, key, options }) => (
              <div key={key} style={{ flex: '1 1 160px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', marginBottom: '0.25rem' }}>{lbl}</label>
                <select className="input-field" value={filters[key]} onChange={e => upd(key, e.target.value)}>
                  {options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', marginBottom: '0.25rem' }}>Max Price (₹)</label>
              <input className="input-field" type="number" placeholder="e.g. 5000" value={filters.maxPrice} onChange={e => upd('maxPrice', e.target.value)} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, color: '#6B7280', marginBottom: '0.25rem' }}>Sort By</label>
              <select className="input-field" value={filters.sort} onChange={e => upd('sort', e.target.value)}>
                {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => setFilters({ search: '', category: 'All', condition: 'All', sort: 'newest', maxPrice: '' })} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8rem', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', marginTop: '0.75rem' }}>
            <X size={13} /> Clear all filters
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ height: '18rem', borderRadius: '0.75rem', background: '#E5E7EB' }} />)}
        </div>
      ) : auctions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#9CA3AF' }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>No auctions found</p>
          <p style={{ fontSize: '0.875rem' }}>Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{auctions.length} auction{auctions.length !== 1 ? 's' : ''} found</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
            {auctions.map(a => <AuctionCard key={a.id} auction={a} />)}
          </div>
        </>
      )}
    </div>
  );
}
