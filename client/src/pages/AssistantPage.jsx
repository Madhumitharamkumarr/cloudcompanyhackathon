import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Bot, Send, User, Sparkles, AlertCircle } from 'lucide-react';

const SUGGESTIONS = [
  'Find me a cycle under ₹2,000',
  'Show scientific calculators in good condition',
  'Which book auctions are under ₹1,000?',
  'How does bidding work on CampusBid?',
  'What electronics are available right now?',
];

function Msg({ m }) {
  const isUser = m.role === 'user';
  return (
    <div style={{display:'flex',gap:'0.75rem',flexDirection:isUser?'row-reverse':'row'}}>
      <div style={{width:'2rem',height:'2rem',borderRadius:'9999px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,background:isUser?'#287A52':'#E4F3E8'}}>
        {isUser ? <User size={15} color="white"/> : <Bot size={15} color="#287A52"/>}
      </div>
      <div style={{maxWidth:'78%',background:isUser?'#287A52':'white',color:isUser?'white':'#20231F',borderRadius:isUser?'1rem 0 1rem 1rem':'0 1rem 1rem 1rem',padding:'0.75rem 1rem',fontSize:'0.875rem',lineHeight:1.6,boxShadow:isUser?'none':'0 1px 4px rgba(0,0,0,0.06)',border:isUser?'none':'1px solid #F0F0EE',whiteSpace:'pre-wrap'}}>
        {m.content}
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [warn, setWarn] = useState(null);
  const bottom = useRef(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    setInput('');
    setWarn(null);
    const userMsg = { role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await api.chat([...messages, userMsg]);
      setMessages(prev => [...prev, res.message]);
      if (res.fallback) setWarn('AI assistant requires an OpenRouter API key on the server. Showing keyword search results instead.');
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I ran into an error. Please try again.' }]);
      setWarn(err.message);
    } finally { setLoading(false); }
  };

  if (!user) return (
    <div style={{textAlign:'center',padding:'5rem'}}>
      <Bot size={48} style={{margin:'0 auto 1rem',color:'#287A52',opacity:0.5}}/>
      <p style={{color:'#6B7280',marginBottom:'1rem'}}>Sign in to use the AI assistant</p>
      <button onClick={()=>navigate('/login')} className="btn-primary">Sign In</button>
    </div>
  );

  return (
    <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 9rem)'}}>
      <div style={{marginBottom:'1rem'}}>
        <h2 style={{fontWeight:700,fontSize:'1.2rem',color:'#20231F',display:'flex',alignItems:'center',gap:'0.5rem',margin:'0 0 0.25rem'}}>
          <Bot size={20} color="#287A52"/> AI Assistant
        </h2>
        <p style={{fontSize:'0.8rem',color:'#9CA3AF',margin:0}}>Powered by OpenRouter. Ask about auctions, bidding, or finding items.</p>
      </div>

      {warn && (
        <div style={{background:'#FFFBEB',border:'1px solid #FDE68A',borderRadius:'0.625rem',padding:'0.75rem',marginBottom:'0.75rem',display:'flex',gap:'0.5rem',fontSize:'0.8rem',color:'#92400E'}}>
          <AlertCircle size={15} style={{flexShrink:0,marginTop:'0.1rem'}} color="#D97706"/> {warn}
        </div>
      )}

      <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:'1rem',marginBottom:'1rem'}}>
        {messages.length === 0 && (
          <div style={{textAlign:'center',padding:'2rem 1rem'}}>
            <div style={{width:'4rem',height:'4rem',background:'#E4F3E8',borderRadius:'9999px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem'}}>
              <Sparkles size={26} color="#287A52"/>
            </div>
            <h3 style={{fontWeight:600,color:'#20231F',margin:'0 0 0.5rem'}}>How can I help you?</h3>
            <p style={{fontSize:'0.875rem',color:'#6B7280',margin:'0 0 1.5rem'}}>Ask me to find items, explain bidding, or search auctions by category and budget.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:'0.5rem',justifyContent:'center'}}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={()=>send(s)} style={{background:'white',border:'1.5px solid #E5E7EB',fontSize:'0.8rem',color:'#4B5563',padding:'0.5rem 0.875rem',borderRadius:'9999px',cursor:'pointer',transition:'all 0.15s'}}
                  onMouseEnter={e=>{e.currentTarget.style.background='#E4F3E8';e.currentTarget.style.color='#287A52';e.currentTarget.style.borderColor='#287A52';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='#4B5563';e.currentTarget.style.borderColor='#E5E7EB';}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => <Msg key={i} m={m}/>)}
        {loading && (
          <div style={{display:'flex',gap:'0.75rem'}}>
            <div style={{width:'2rem',height:'2rem',borderRadius:'9999px',background:'#E4F3E8',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <Bot size={15} color="#287A52"/>
            </div>
            <div style={{background:'white',borderRadius:'0 1rem 1rem 1rem',padding:'0.875rem 1.125rem',border:'1px solid #F0F0EE'}}>
              <div style={{display:'flex',gap:'0.375rem'}}>
                {[0,1,2].map(i=><div key={i} style={{width:'0.5rem',height:'0.5rem',borderRadius:'9999px',background:'#D1D5DB',animation:'bounce 1s infinite',animationDelay:`${i*0.15}s`}}/>)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottom}/>
      </div>

      <div style={{display:'flex',gap:'0.5rem'}}>
        <input className="input-field" style={{flex:1}} placeholder="Ask me anything about CampusBid..." value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} disabled={loading}/>
        <button onClick={()=>send()} disabled={loading||!input.trim()} className="btn-primary" style={{padding:'0.625rem 1rem'}}>
          <Send size={18}/>
        </button>
      </div>

      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}
