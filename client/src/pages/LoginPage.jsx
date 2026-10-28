import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Gavel, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', college: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(form.email, form.password);
      } else {
        if (!form.name.trim()) { addToast('Name is required', 'error'); setLoading(false); return; }
        if (!/^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+edu$/i.test(form.email.trim())) {
          addToast('Please use a valid .edu email address', 'error');
          setLoading(false);
          return;
        }
        await register(form.name, form.email, form.password, form.college);
      }
      addToast('Welcome to CampusBid! 🎉', 'success');
      navigate('/');
    } catch (err) {
      addToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: '26rem' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.5rem', height: '3.5rem', background: '#287A52', borderRadius: '1rem', marginBottom: '1rem' }}>
            <Gavel size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#20231F', margin: 0 }}>CampusBid</h1>
          <p style={{ color: '#6B7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>Good finds. Fair bids. New beginnings.</p>
        </div>

        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Demo notice */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1.25rem', fontSize: '0.75rem', color: '#92400E' }}>
            <strong>Demo Mode:</strong> Data resets on server restart. Try:{' '}
            <code style={{ background: '#FEF3C7', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>arjun@college.edu</code> /{' '}
            <code style={{ background: '#FEF3C7', padding: '0.1rem 0.3rem', borderRadius: '0.25rem' }}>password123</code>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: '0.5rem', padding: '0.25rem', marginBottom: '1.25rem' }}>
            {[['login', 'Sign In'], ['register', 'Register']].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '0.5rem', fontSize: '0.875rem', fontWeight: 500, borderRadius: '0.375rem', border: 'none', cursor: 'pointer',
                background: tab === t ? 'white' : 'transparent',
                color: tab === t ? '#287A52' : '#6B7280',
                boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s',
              }}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tab === 'register' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Full Name</label>
                  <input className="input-field" placeholder="Arjun Sharma" value={form.name} onChange={e => update('name', e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>College</label>
                  <input className="input-field" placeholder="IIT Bombay" value={form.college} onChange={e => update('college', e.target.value)} />
                </div>
              </>
            )}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Email</label>
              <input className="input-field" type="email" placeholder="you@college.edu" value={form.email} onChange={e => update('email', e.target.value)} required />
              {tab === 'register' && <p style={{fontSize:'0.75rem',color:'#6B7280',margin:'0.375rem 0 0'}}>Registration requires a valid .edu email address.</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.375rem' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input className="input-field" type={showPw ? 'text' : 'password'} placeholder="••••••" value={form.password} onChange={e => update('password', e.target.value)} required style={{ paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}>
              {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
