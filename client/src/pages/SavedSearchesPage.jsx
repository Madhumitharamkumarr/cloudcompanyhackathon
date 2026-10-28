import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { BookMarked, Plus, Trash2, Search } from 'lucide-react';

const CATS = ['All','Cycles','Calculators','Books','Electronics','Accessories','Other'];
const CONDS = ['All','Like New','Good','Fair','Needs Repair'];

export default function SavedSearchesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searches, setSearches] = useState([]);
  const [form, setForm] = useState({ keywords:'', category:'All', maxPrice:'', condition:'All' });
  const [show, setShow] = useState(false);

  const load = () => { if (user) api.getSavedSearches().then(setSearches).catch(()=>{}); };
  useEffect(load, [user]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.keywords && form.category==='All' && !form.maxPrice) return addToast('Add at least one criterion','error');
    try { await api.createSavedSearch(form); addToast('Search saved!','success'); setShow(false); setForm({keywords:'',category:'All',maxPrice:'',condition:'All'}); load(); }
    catch(err){ addToast(err.message,'error'); }
  };

  const del = async (id) => {
    try { await api.deleteSavedSearch(id); addToast('Removed','success'); load(); }
    catch(err){ addToast(err.message,'error'); }
  };

  if (!user) return <div style={{textAlign:'center',padding:'5rem'}}><button onClick={()=>navigate('/login')} className="btn-primary">Sign in</button></div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h2 style={{fontWeight:700,fontSize:'1.2rem',color:'#20231F',margin:0}}>Saved Searches</h2>
        <button onClick={()=>setShow(v=>!v)} className="btn-primary" style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.875rem'}}><Plus size={15}/> Save Search</button>
      </div>

      <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'0.75rem',padding:'0.75rem',fontSize:'0.8rem',color:'#92400E'}}>
        Saved searches notify you when new matching listings are created. In-app notifications are instant. Browser notifications require the app to be open.
      </div>

      {show && (
        <form onSubmit={save} className="card" style={{padding:'1.25rem',display:'flex',flexDirection:'column',gap:'0.875rem'}}>
          <h3 style={{fontWeight:600,color:'#374151',margin:0,fontSize:'0.9rem'}}>New Saved Search</h3>
          <input className="input-field" placeholder="Keywords (e.g. calculator, bicycle)" value={form.keywords} onChange={e=>setForm(f=>({...f,keywords:e.target.value}))}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
            <select className="input-field" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
            <select className="input-field" value={form.condition} onChange={e=>setForm(f=>({...f,condition:e.target.value}))}>{CONDS.map(c=><option key={c}>{c}</option>)}</select>
          </div>
          <input className="input-field" type="number" placeholder="Max price (₹)" value={form.maxPrice} onChange={e=>setForm(f=>({...f,maxPrice:e.target.value}))}/>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <button type="submit" className="btn-primary" style={{fontSize:'0.875rem'}}>Save Search</button>
            <button type="button" onClick={()=>setShow(false)} className="btn-secondary" style={{fontSize:'0.875rem'}}>Cancel</button>
          </div>
        </form>
      )}

      {searches.length === 0 ? (
        <div style={{textAlign:'center',padding:'4rem',color:'#9CA3AF'}}>
          <BookMarked size={40} style={{margin:'0 auto 0.75rem',opacity:0.4}}/>
          <p>No saved searches yet</p>
        </div>
      ) : searches.map(s => (
        <div key={s.id} className="card" style={{padding:'1rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
          <div style={{flex:1}}>
            <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',alignItems:'center',fontSize:'0.875rem'}}>
              {s.keywords && <span style={{display:'flex',alignItems:'center',gap:'0.25rem',color:'#374151'}}><Search size={13} color="#9CA3AF"/> {s.keywords}</span>}
              {s.category && s.category!=='All' && <span className="badge" style={{background:'#E4F3E8',color:'#287A52'}}>{s.category}</span>}
              {s.condition && s.condition!=='All' && <span className="badge" style={{background:'#F3F4F6',color:'#374151'}}>{s.condition}</span>}
              {s.maxPrice && <span style={{color:'#6B7280'}}>Under ₹{Number(s.maxPrice).toLocaleString('en-IN')}</span>}
            </div>
            <p style={{fontSize:'0.75rem',color:'#9CA3AF',margin:'0.375rem 0 0'}}>Saved {new Date(s.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <button onClick={()=>navigate(`/auctions?search=${s.keywords||''}`)} className="btn-secondary" style={{padding:'0.5rem',fontSize:'0.8rem'}}><Search size={14}/></button>
            <button onClick={()=>del(s.id)} style={{padding:'0.5rem',background:'none',border:'1.5px solid #FCA5A5',borderRadius:'0.5rem',color:'#EF4444',cursor:'pointer'}}><Trash2 size={14}/></button>
          </div>
        </div>
      ))}
    </div>
  );
}
