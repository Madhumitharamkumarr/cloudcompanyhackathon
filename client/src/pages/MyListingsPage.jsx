import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import Countdown from '../components/Countdown';
import { Package, Plus, Gavel, AlertCircle } from 'lucide-react';

export default function MyListingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!user) return;
    api.getAuctions().then(all => setAuctions(all.filter(a => a.sellerId === user.id))).finally(() => setLoading(false));
  };
  useEffect(load, [user]);

  if (!user) return <div style={{textAlign:'center',padding:'5rem'}}><button onClick={()=>navigate('/login')} className="btn-primary">Sign in</button></div>;
  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'5rem'}}><div className="spinner"/></div>;

  const pending = auctions.filter(a => a.status === 'PENDING_SELLER_APPROVAL');

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h2 style={{fontWeight:700,fontSize:'1.2rem',color:'#20231F',margin:0}}>My Listings</h2>
        <button onClick={()=>navigate('/sell')} className="btn-primary" style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.875rem'}}>
          <Plus size={15}/> New Auction
        </button>
      </div>

      {pending.length > 0 && (
        <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'0.75rem',padding:'1rem'}}>
          <h3 style={{fontWeight:600,color:'#92400E',display:'flex',alignItems:'center',gap:'0.5rem',margin:'0 0 0.75rem',fontSize:'0.95rem'}}>
            <AlertCircle size={15}/> Awaiting Your Decision
          </h3>
          <div style={{display:'flex',flexDirection:'column',gap:'0.5rem'}}>
            {pending.map(a => (
              <div key={a.id} onClick={()=>navigate(`/auctions/${a.id}`)} style={{background:'white',borderRadius:'0.5rem',padding:'0.75rem',cursor:'pointer',border:'1px solid #FDE68A',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <p style={{fontWeight:600,fontSize:'0.875rem',margin:'0 0 0.2rem'}}>{a.title}</p>
                  <p style={{fontSize:'0.8rem',color:'#6B7280',margin:0}}>Winning bid: ₹{a.provisionalAmount?.toLocaleString('en-IN')} by {a.provisionalWinnerName}</p>
                </div>
                <span style={{fontSize:'0.8rem',color:'#D97706',fontWeight:500}}>Decide →</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {auctions.length === 0 ? (
        <div style={{textAlign:'center',padding:'4rem',color:'#9CA3AF'}}>
          <Package size={40} style={{margin:'0 auto 0.75rem',opacity:0.4}}/>
          <p style={{fontWeight:500,margin:'0 0 0.5rem'}}>No listings yet</p>
          <button onClick={()=>navigate('/sell')} className="btn-primary" style={{display:'inline-flex',alignItems:'center',gap:'0.375rem',marginTop:'0.5rem'}}>
            <Plus size={15}/> Create Auction
          </button>
        </div>
      ) : auctions.map(a => (
        <div key={a.id} onClick={()=>navigate(`/auctions/${a.id}`)} className="card" style={{padding:'1rem',display:'flex',alignItems:'center',gap:'1rem',cursor:'pointer'}}
          onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
          onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
          {a.images?.[0] && <img src={a.images[0]} style={{width:'4rem',height:'4rem',objectFit:'cover',borderRadius:'0.5rem',flexShrink:0}} alt=""/>}
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontWeight:600,fontSize:'0.9rem',color:'#20231F',margin:'0 0 0.375rem',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.title}</p>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem',fontSize:'0.8rem'}}>
              <StatusBadge status={a.status}/>
              <span style={{color:'#9CA3AF',display:'flex',alignItems:'center',gap:'0.2rem'}}><Gavel size={11}/> {a.bidCount} bids</span>
              <span style={{color:'#287A52',fontWeight:600}}>₹{(a.currentBid||a.startingPrice).toLocaleString('en-IN')}</span>
            </div>
          </div>
          {a.status==='ACTIVE' && <Countdown closingTime={a.closingTime} compact/>}
        </div>
      ))}
    </div>
  );
}
