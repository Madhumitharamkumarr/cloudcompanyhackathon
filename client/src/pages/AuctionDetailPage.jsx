import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Countdown from '../components/Countdown';
import StatusBadge from '../components/StatusBadge';
import {
  Gavel, User, TrendingUp, MessageCircle, ArrowLeft,
  CheckCircle, XCircle, Zap, AlertTriangle
} from 'lucide-react';

/* ── Bid History ─────────────────────────────────────────── */
function BidHistory({ bids }) {
  if (bids.length === 0)
    return <p style={{ textAlign: 'center', color: '#9CA3AF', fontSize: '0.875rem', padding: '1.5rem 0' }}>No bids yet. Be the first!</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {bids.map((b, i) => (
        <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', background: i === 0 ? '#E4F3E8' : '#F9FAFB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '9999px', background: '#287A52', color: 'white', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {b.bidderName?.[0]}
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#20231F', margin: 0 }}>
                {b.bidderName} {b.isAuto && <span style={{ fontSize: '0.7rem', color: '#287A52', fontWeight: 400 }}>(auto)</span>}
              </p>
              <p style={{ fontSize: '0.7rem', color: '#9CA3AF', margin: 0 }}>{new Date(b.timestamp).toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 700, color: '#287A52', fontSize: '0.95rem', margin: 0 }}>₹{b.amount.toLocaleString('en-IN')}</p>
            {i === 0 && <p style={{ fontSize: '0.7rem', color: '#287A52', margin: 0 }}>Highest ↑</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Q&A Panel ────────────────────────────────────────────── */
function QAPanel({ auctionId, sellerId, questions, onRefresh }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [q, setQ] = useState('');
  const [answers, setAnswers] = useState({});

  const submitQ = async (e) => {
    e.preventDefault();
    if (!q.trim() || q.length < 5) return addToast('Question must be at least 5 characters', 'error');
    try { await api.askQuestion(auctionId, q.trim()); setQ(''); addToast('Question posted!', 'success'); onRefresh(); }
    catch (err) { addToast(err.message, 'error'); }
  };

  const submitA = async (qId) => {
    const a = answers[qId];
    if (!a?.trim()) return addToast('Answer cannot be empty', 'error');
    try { await api.answerQuestion(qId, a.trim()); setAnswers(p => { const n = { ...p }; delete n[qId]; return n; }); addToast('Answered!', 'success'); onRefresh(); }
    catch (err) { addToast(err.message, 'error'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <h3 style={{ fontWeight: 600, color: '#20231F', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
        <MessageCircle size={16} /> Questions & Answers
      </h3>

      {questions.length === 0 && <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>No questions yet.</p>}

      {questions.map(item => (
        <div key={item.id}>
          <div style={{ background: '#EFF6FF', borderRadius: '0.5rem', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#3B82F6', margin: '0 0 0.25rem' }}>{item.askerName} asked:</p>
            <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>{item.question}</p>
          </div>
          {item.answer ? (
            <div style={{ background: '#E4F3E8', borderRadius: '0.5rem', padding: '0.75rem', marginLeft: '1rem', marginTop: '0.375rem' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#287A52', margin: '0 0 0.25rem' }}>Seller replied:</p>
              <p style={{ fontSize: '0.875rem', color: '#374151', margin: 0 }}>{item.answer}</p>
            </div>
          ) : user?.id === sellerId ? (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', marginTop: '0.375rem' }}>
              <input className="input-field" placeholder="Type your answer..." value={answers[item.id] || ''} onChange={e => setAnswers(p => ({ ...p, [item.id]: e.target.value }))} style={{ fontSize: '0.8rem' }} />
              <button onClick={() => submitA(item.id)} className="btn-primary" style={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>Answer</button>
            </div>
          ) : (
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginLeft: '1rem', marginTop: '0.25rem' }}>Awaiting seller response</p>
          )}
        </div>
      ))}

      {user && user.id !== sellerId && (
        <form onSubmit={submitQ} style={{ display: 'flex', gap: '0.5rem' }}>
          <input className="input-field" placeholder="Ask the seller a question..." value={q} onChange={e => setQ(e.target.value)} maxLength={500} style={{ flex: 1, fontSize: '0.875rem' }} />
          <button type="submit" className="btn-secondary" style={{ whiteSpace: 'nowrap', fontSize: '0.875rem' }}>Ask</button>
        </form>
      )}
      {!user && <p style={{ fontSize: '0.875rem', color: '#9CA3AF' }}>Sign in to ask questions.</p>}
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function AuctionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('bids');
  const [bidAmount, setBidAmount] = useState('');
  const [maxBid, setMaxBid] = useState('');
  const [showAutoBid, setShowAutoBid] = useState(false);
  const [bidLoading, setBidLoading] = useState(false);
  const [autoLoading, setAutoLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, b, q] = await Promise.all([api.getAuction(id), api.getBids(id), api.getQuestions(id)]);
      setAuction(a); setBids(b); setQuestions(q);
    } catch {
      addToast('Failed to load auction', 'error');
      navigate('/auctions');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem' }}><div className="spinner" /></div>;
  if (!auction) return null;

  const isSeller = user?.id === auction.sellerId;
  const isActive = auction.status === 'ACTIVE';
  const canBid = user && isActive && !isSeller;
  const minBid = auction.currentBid ? auction.currentBid + auction.minIncrement : auction.startingPrice;

  const placeBid = async () => {
    const amt = Number(bidAmount);
    if (!amt || amt < minBid) return addToast(`Bid must be at least ₹${minBid.toLocaleString('en-IN')}`, 'error');
    setBidLoading(true);
    try {
      const result = await api.placeBid(id, amt);
      setAuction(result.auction);
      await load();
      setBidAmount('');
      addToast(result.closingTimeExtended ? '✅ Bid placed! Deadline extended (anti-sniping).' : '✅ Bid placed successfully!', 'success');
    } catch (err) { addToast(err.message || 'Bid failed', 'error'); }
    finally { setBidLoading(false); }
  };

  const confirmAutoBid = async () => {
    const max = Number(maxBid);
    if (!max || max < minBid) return addToast(`Max must be at least ₹${minBid.toLocaleString('en-IN')}`, 'error');
    setAutoLoading(true);
    try {
      await api.setAutoBid(id, max);
      setMaxBid(''); setShowAutoBid(false);
      addToast('Auto-bid set! System will bid for you up to your maximum.', 'success');
    } catch (err) { addToast(err.message, 'error'); }
    finally { setAutoLoading(false); }
  };

  const decide = async (decision) => {
    if (!window.confirm(`${decision === 'approve' ? 'Approve' : 'Reject'} this winning bid?`)) return;
    try { const u = await api.makeDecision(id, decision); setAuction(u); addToast(`Auction ${decision}d.`, 'success'); }
    catch (err) { addToast(err.message, 'error'); }
  };

  const doHandover = async (status) => {
    if (!window.confirm(`Mark as ${status === 'SOLD' ? 'Sold' : 'Failed Pickup'}?`)) return;
    try { const u = await api.handover(id, status); setAuction(u); addToast('Updated.', 'success'); }
    catch (err) { addToast(err.message, 'error'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="auction-grid">
        {/* LEFT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Image */}
          <div className="card" style={{ overflow: 'hidden' }}>
            {auction.images?.[0]
              ? <img src={auction.images[0]} alt={auction.title} style={{ width: '100%', height: '20rem', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '20rem', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB' }}><Gavel size={64} /></div>
            }
          </div>

          {/* Info */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ background: '#E4F3E8', color: '#287A52', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.75rem', borderRadius: '9999px' }}>{auction.category}</span>
              <span style={{ background: '#F3F4F6', color: '#374151', fontSize: '0.75rem', fontWeight: 500, padding: '0.2rem 0.75rem', borderRadius: '9999px' }}>{auction.condition}</span>
              <StatusBadge status={auction.status} />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#20231F', margin: '0 0 0.75rem' }}>{auction.title}</h1>
            <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.6, margin: '0 0 0.75rem' }}>{auction.description}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#6B7280' }}>
              <User size={14} /> Listed by <strong>{auction.sellerName}</strong>
            </div>
          </div>

          {/* Tabs: Bids / Q&A */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #F0F0EE', marginBottom: '1rem', gap: '1rem' }}>
              {[['bids', `Bid History (${bids.length})`], ['qa', `Q&A (${questions.length})`]].map(([t, lbl]) => (
                <button key={t} onClick={() => setTab(t)} style={{ paddingBottom: '0.625rem', fontSize: '0.875rem', fontWeight: 500, background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? '#287A52' : 'transparent'}`, color: tab === t ? '#287A52' : '#6B7280', cursor: 'pointer' }}>
                  {lbl}
                </button>
              ))}
            </div>
            {tab === 'bids' ? <BidHistory bids={bids} /> : <QAPanel auctionId={id} sellerId={auction.sellerId} questions={questions} onRefresh={load} />}
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Price + Bid */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <p style={{ fontSize: '0.75rem', color: '#9CA3AF', margin: '0 0 0.25rem' }}>
              {auction.bidCount > 0 ? 'Current leading bid' : 'Starting price'}
            </p>
            <p style={{ fontSize: '2rem', fontWeight: 700, color: '#287A52', margin: '0 0 0.5rem' }}>
              ₹{(auction.currentBid || auction.startingPrice).toLocaleString('en-IN')}
            </p>
            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#6B7280', marginBottom: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Gavel size={13} /> {auction.bidCount} bids</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><TrendingUp size={13} /> +₹{auction.minIncrement} min</span>
            </div>

            {isActive && (
              <div style={{ background: '#F8F7F4', borderRadius: '0.625rem', padding: '0.75rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.7rem', color: '#9CA3AF', margin: '0 0 0.25rem' }}>Auction ends in</p>
                <Countdown closingTime={auction.closingTime} />
              </div>
            )}

            {/* Seller: pending decision */}
            {isSeller && auction.status === 'PENDING_SELLER_APPROVAL' && (
              <div>
                <div style={{ background: '#FEF9C3', border: '1px solid #FDE68A', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.75rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#92400E', margin: '0 0 0.2rem' }}>
                    Winning Bid: ₹{auction.provisionalAmount?.toLocaleString('en-IN')}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#A16207', margin: 0 }}>By: {auction.provisionalWinnerName}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button onClick={() => decide('approve')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                    <CheckCircle size={14} /> Approve
                  </button>
                  <button onClick={() => decide('reject')} className="btn-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            )}

            {/* Seller: reserved → handover */}
            {isSeller && auction.status === 'RESERVED' && (
              <div>
                <p style={{ fontSize: '0.875rem', color: '#1D4ED8', background: '#DBEAFE', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.75rem' }}>
                  Reserved for <strong>{auction.provisionalWinnerName}</strong>. Confirm handover below.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button onClick={() => doHandover('SOLD')} className="btn-primary" style={{ fontSize: '0.875rem' }}>Confirm Sale</button>
                  <button onClick={() => doHandover('FAILED_PICKUP')} className="btn-danger" style={{ fontSize: '0.875rem' }}>Failed Pickup</button>
                </div>
              </div>
            )}

            {/* Buyer: bid form */}
            {canBid && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#6B7280', margin: 0 }}>
                  Minimum next bid: <strong style={{ color: '#287A52' }}>₹{minBid.toLocaleString('en-IN')}</strong>
                </p>
                <input
                  type="number"
                  className="input-field"
                  placeholder={`₹${minBid.toLocaleString('en-IN')} or more`}
                  value={bidAmount}
                  onChange={e => setBidAmount(e.target.value)}
                  min={minBid}
                />
                <button onClick={placeBid} disabled={bidLoading} className="btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem' }}>
                  <Gavel size={16} /> {bidLoading ? 'Placing...' : 'Place Bid'}
                </button>

                <button onClick={() => setShowAutoBid(v => !v)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', fontSize: '0.8rem', color: '#287A52', background: 'none', border: '1.5px solid #287A52', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer' }}>
                  <Zap size={14} /> {showAutoBid ? 'Hide Auto-Bid' : 'Set Auto-Bid Maximum'}
                </button>

                {showAutoBid && (
                  <div style={{ background: '#E4F3E8', borderRadius: '0.625rem', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#374151', margin: 0 }}>
                      Set your maximum. System bids automatically to keep you in the lead — never exceeding it.
                    </p>
                    <input type="number" className="input-field" placeholder={`Your maximum (min ₹${minBid.toLocaleString('en-IN')})`} value={maxBid} onChange={e => setMaxBid(e.target.value)} min={minBid} style={{ fontSize: '0.875rem' }} />
                    <button onClick={confirmAutoBid} disabled={autoLoading} className="btn-primary" style={{ fontSize: '0.875rem' }}>
                      {autoLoading ? 'Setting...' : 'Confirm Auto-Bid'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!user && isActive && (
              <button onClick={() => navigate('/login')} className="btn-primary" style={{ width: '100%', padding: '0.75rem' }}>Sign In to Bid</button>
            )}
            {isSeller && isActive && (
              <div style={{ background: '#DBEAFE', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.875rem', color: '#1D4ED8' }}>
                You are the seller of this auction.
              </div>
            )}
            {auction.status === 'SOLD' && (
              <div style={{ background: '#DCFCE7', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.875rem', color: '#15803D', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} /> Item sold successfully!
              </div>
            )}
            {auction.status === 'UNSOLD' && (
              <div style={{ background: '#F3F4F6', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.875rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={16} /> Auction closed with no bids.
              </div>
            )}
          </div>

          {/* Auction details */}
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              ['Starting Price', `₹${auction.startingPrice.toLocaleString('en-IN')}`],
              ['Min Increment', `₹${auction.minIncrement.toLocaleString('en-IN')}`],
              ['Listed', new Date(auction.createdAt).toLocaleDateString('en-IN')],
              ['Closes', new Date(auction.closingTime).toLocaleString('en-IN')],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: '#9CA3AF' }}>{k}</span>
                <span style={{ fontWeight: 500, color: '#20231F' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Cancel */}
          {isSeller && isActive && auction.bidCount === 0 && (
            <button onClick={async () => { if (window.confirm('Cancel this auction?')) { try { await api.cancelAuction(id); await load(); addToast('Auction cancelled', 'info'); } catch (e) { addToast(e.message, 'error'); } } }} className="btn-danger" style={{ width: '100%', fontSize: '0.875rem' }}>
              Cancel Auction
            </button>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .auction-grid { grid-template-columns: 1fr 380px !important; }
        }
      `}</style>
    </div>
  );
}
