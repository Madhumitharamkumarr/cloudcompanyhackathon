import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Countdown from '../components/Countdown';
import { Gavel, Trophy } from 'lucide-react';

export default function MyBidsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.getAuctions().then(async (auctions) => {
      const results = [];
      for (const a of auctions) {
        try {
          const bids = await api.getBids(a.id);
          const mine = bids.filter(b => b.bidderId === user.id);
          if (mine.length > 0) {
            const myHighest = Math.max(...mine.map(b => b.amount));
            const isWinning = (a.currentBid === myHighest) && ['ACTIVE','PENDING_SELLER_APPROVAL'].includes(a.status);
            results.push({ auction: a, myHighest, isWinning, count: mine.length });
          }
        } catch (_) {}
      }
      setData(results);
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) return <div style={{textAlign:'center',padding:'5rem'}}><button onClick={()=>navigate('/login')} className="btn-primary">Sign in to see your bids</button></div>;
  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:'5rem'}}><div className="spinner"/></div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
      <h2 style={{fontWeight:700,fontSize:'1.2rem',color:'#20231F',margin:0}}>My Bids</h2>
      {data.length === 0 ? (
        <div style={{textAlign:'center',padding:'4rem',color:'#9CA3AF'}}>
          <Gavel size={40} style={{margin:'0 auto 0.75rem',opacity:0.4}}/>
          <p style={{fontWeight:500,margin:'0 0 0.5rem'}}>No bids yet</p>
          <p style={{fontSize:'0.875rem',margin:'0 0 1rem'}}>Browse auctions and place your first bid!</p>
          <button onClick={()=>navigate('/auctions')} className="btn-primary">Browse Auctions</button>
        </div>
      ) : data.map(({ auction:a, myHighest, isWinning, count }) => (
        <div key={a.id} onClick={()=>navigate(`/auctions/${a.id}`)} className="card" style={{padding:'1rem',display:'flex',alignItems:'center',gap:'1rem',cursor:'pointer'}}
          onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
          onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
          {a.images?.[0] && <img src={a.images[0]} style={{width:'4rem',height:'4rem',objectFit:'cover',borderRadius:'0.5rem',flexShrink:0}} alt=""/>}
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',flexWrap:'wrap',marginBottom:'0.375rem'}}>
              <h3 style={{fontWeight:600,fontSize:'0.9rem',color:'#20231F',margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'16rem'}}>{a.title}</h3>
              {isWinning && <span className="badge" style={{background:'#FEF9C3',color:'#92400E',display:'flex',alignItems:'center',gap:'0.2rem'}}><Trophy size={10}/> Winning</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flexWrap:'wrap',fontSize:'0.8rem',color:'#6B7280'}}>
              <StatusBadge status={a.status}/>
              <span>My top: <strong style={{color:'#287A52'}}>₹{myHighest.toLocaleString('en-IN')}</strong></span>
              <span>Current: ₹{(a.currentBid||a.startingPrice).toLocaleString('en-IN')}</span>
            </div>
          </div>
          {a.status==='ACTIVE' && <Countdown closingTime={a.closingTime} compact/>}
        </div>
      ))}
    </div>
  );
}
