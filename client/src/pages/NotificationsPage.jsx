import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';

const TYPE_COLORS = {
  BID_OUTBID:'#EF4444', AUCTION_WON:'#287A52', BID_REJECTED:'#EF4444',
  SAVED_SEARCH_MATCH:'#3B82F6', AUCTION_ENDING:'#F59E0B', HANDOVER_COMPLETE:'#287A52',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perm, setPerm] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  const load = () => { if (user) api.getNotifications().then(setNotifs).catch(()=>{}).finally(()=>setLoading(false)); };
  useEffect(load, [user]);

  const markRead = async (id) => { await api.markRead(id).catch(()=>{}); load(); };
  const markAll = async () => { await api.markAllRead().catch(()=>{}); load(); addToast('All marked as read','success'); };

  const reqBrowser = async () => {
    if (typeof Notification === 'undefined') return addToast('Browser notifications not supported','error');
    const p = await Notification.requestPermission();
    setPerm(p);
    addToast(p === 'granted' ? 'Browser notifications enabled!':'Permission denied', p==='granted'?'success':'error');
  };

  if (!user) return <div style={{textAlign:'center',padding:'5rem'}}><button onClick={()=>navigate('/login')} className="btn-primary">Sign in</button></div>;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h2 style={{fontWeight:700,fontSize:'1.2rem',color:'#20231F',margin:0}}>Notifications</h2>
        {notifs.some(n=>!n.read) && (
          <button onClick={markAll} className="btn-secondary" style={{display:'flex',alignItems:'center',gap:'0.375rem',fontSize:'0.875rem'}}>
            <CheckCheck size={14}/> Mark all read
          </button>
        )}
      </div>

      {perm !== 'granted' && perm !== 'unsupported' && (
        <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:'0.75rem',padding:'1rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
          <div>
            <p style={{fontWeight:600,color:'#1D4ED8',fontSize:'0.9rem',margin:'0 0 0.2rem'}}>Enable browser notifications</p>
            <p style={{fontSize:'0.8rem',color:'#3B82F6',margin:0}}>Stay informed while on other tabs. Requires app to be open.</p>
          </div>
          <button onClick={reqBrowser} className="btn-primary" style={{whiteSpace:'nowrap',fontSize:'0.875rem'}}>Enable</button>
        </div>
      )}

      {loading ? <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}><div className="spinner"/></div>
       : notifs.length === 0 ? (
        <div style={{textAlign:'center',padding:'4rem',color:'#9CA3AF'}}>
          <Bell size={40} style={{margin:'0 auto 0.75rem',opacity:0.4}}/>
          <p>No notifications yet</p>
        </div>
       ) : notifs.map(n => (
        <div key={n.id}
          onClick={()=>{ if(!n.read) markRead(n.id); if(n.auctionId) navigate(`/auctions/${n.auctionId}`); }}
          className="card"
          style={{padding:'1rem',borderLeft:`4px solid ${TYPE_COLORS[n.type]||'#E5E7EB'}`,cursor:'pointer',opacity:n.read?0.65:1,transition:'box-shadow 0.15s'}}
          onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'}
          onMouseLeave={e=>e.currentTarget.style.boxShadow=''}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'0.75rem'}}>
            <p style={{fontSize:'0.875rem',fontWeight:n.read?400:600,color:n.read?'#6B7280':'#20231F',margin:0}}>{n.message}</p>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',flexShrink:0}}>
              {!n.read && <div style={{width:'0.5rem',height:'0.5rem',background:'#287A52',borderRadius:'9999px'}}/>}
              {n.auctionId && <ExternalLink size={13} color="#9CA3AF"/>}
            </div>
          </div>
          <p style={{fontSize:'0.75rem',color:'#9CA3AF',margin:'0.375rem 0 0'}}>{new Date(n.createdAt).toLocaleString('en-IN')}</p>
        </div>
       ))}
    </div>
  );
}
