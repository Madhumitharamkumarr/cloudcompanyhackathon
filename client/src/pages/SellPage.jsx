import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Upload, X, ImageIcon } from 'lucide-react';

const CATS = ['Cycles', 'Calculators', 'Books', 'Electronics', 'Accessories', 'Other'];
const CONDS = ['Like New', 'Good', 'Fair', 'Needs Repair'];

const defaultClose = () => new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16);

export default function SellPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', category: 'Electronics', description: '', condition: 'Good',
    startingPrice: '', minIncrement: '50', closingTime: defaultClose(),
  });
  const [images, setImages] = useState([]);
  const [imageUrl, setImageUrl] = useState('');

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
      <p style={{ color: '#6B7280', marginBottom: '1rem' }}>Please sign in to list items.</p>
      <button onClick={() => navigate('/login')} className="btn-primary">Sign In</button>
    </div>
  );

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addUrl = () => {
    if (imageUrl.trim() && images.length < 5) { setImages(p => [...p, imageUrl.trim()]); setImageUrl(''); }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file || images.length >= 5) return;
    const reader = new FileReader();
    reader.onload = ev => setImages(p => [...p, ev.target.result]);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.startingPrice || !form.closingTime)
      return addToast('Fill in all required fields', 'error');
    if (Number(form.startingPrice) <= 0) return addToast('Starting price must be positive', 'error');
    if (new Date(form.closingTime) <= new Date()) return addToast('Closing time must be in the future', 'error');
    setLoading(true);
    try {
      const a = await api.createAuction({
        ...form,
        startingPrice: Number(form.startingPrice),
        minIncrement: Number(form.minIncrement) || 50,
        images,
      });
      addToast('Auction created! 🎉', 'success');
      navigate(`/auctions/${a.id}`);
    } catch (err) {
      addToast(err.message || 'Failed to create auction', 'error');
    } finally { setLoading(false); }
  };

  const Section = ({ title, children }) => (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontWeight: 600, color: '#374151', margin: 0, fontSize: '0.95rem' }}>{title}</h3>
      {children}
    </div>
  );

  const Field = ({ label, required, children }) => (
    <div>
      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div style={{ maxWidth: '42rem' }}>
      <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#20231F', marginBottom: '1.5rem' }}>List an Item for Sale</h2>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Section title="Item Details">
          <Field label="Title" required>
            <input className="input-field" placeholder="e.g. Hero Sprint 26T Mountain Bicycle" value={form.title} onChange={e => upd('title', e.target.value)} required maxLength={100} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Category" required>
              <select className="input-field" value={form.category} onChange={e => upd('category', e.target.value)}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Condition" required>
              <select className="input-field" value={form.condition} onChange={e => upd('condition', e.target.value)}>
                {CONDS.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Description" required>
            <textarea className="input-field" style={{ height: '7rem', resize: 'vertical' }} placeholder="Describe the item, condition, what's included, any defects..." value={form.description} onChange={e => upd('description', e.target.value)} required maxLength={2000} />
          </Field>
        </Section>

        <Section title="Photos (optional, up to 5)">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="input-field" placeholder="Paste image URL..." value={imageUrl} onChange={e => setImageUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())} />
            <button type="button" onClick={addUrl} className="btn-secondary" style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>Add URL</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#9CA3AF' }}>
            or
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#287A52' }}>
              <Upload size={14} /> Upload file
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            </label>
          </div>
          {images.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {images.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={img} alt={`preview-${i}`} style={{ width: '5.5rem', height: '5.5rem', objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }} />
                  <button type="button" onClick={() => setImages(p => p.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: '-0.375rem', right: '-0.375rem', width: '1.25rem', height: '1.25rem', background: '#EF4444', color: 'white', borderRadius: '9999px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ border: '2px dashed #E5E7EB', borderRadius: '0.625rem', padding: '2rem', textAlign: 'center', color: '#D1D5DB' }}>
              <ImageIcon size={32} style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontSize: '0.875rem', margin: 0 }}>Add photos to attract more bidders</p>
            </div>
          )}
        </Section>

        <Section title="Pricing & Timing">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field label="Starting Price (₹)" required>
              <input className="input-field" type="number" min="1" placeholder="500" value={form.startingPrice} onChange={e => upd('startingPrice', e.target.value)} required />
            </Field>
            <Field label="Min Increment (₹)">
              <input className="input-field" type="number" min="1" placeholder="50" value={form.minIncrement} onChange={e => upd('minIncrement', e.target.value)} />
            </Field>
          </div>
          <Field label="Auction Closing Time" required>
            <input className="input-field" type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={form.closingTime} onChange={e => upd('closingTime', e.target.value)} required />
          </Field>
        </Section>

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}>
          {loading ? 'Creating Auction...' : '🎉 Create Auction'}
        </button>
      </form>
    </div>
  );
}
