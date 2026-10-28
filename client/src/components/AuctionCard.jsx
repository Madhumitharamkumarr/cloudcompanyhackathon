import { useNavigate } from 'react-router-dom';
import { Gavel, User } from 'lucide-react';
import Countdown from './Countdown';
import StatusBadge from './StatusBadge';

export default function AuctionCard({ auction }) {
  const navigate = useNavigate();
  const price = auction.currentBid || auction.startingPrice;

  return (
    <div
      onClick={() => navigate(`/auctions/${auction.id}`)}
      style={{
        background: 'white',
        borderRadius: '0.75rem',
        border: '1px solid #F0F0EE',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: '180px', background: '#F3F4F6', overflow: 'hidden' }}>
        {auction.images?.[0] ? (
          <img src={auction.images[0]} alt={auction.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D1D5DB' }}>
            <Gavel size={40} />
          </div>
        )}
        <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem' }}>
          <StatusBadge status={auction.status} />
        </div>
        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.55)', color: 'white', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>
          {auction.condition}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        <h3 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#20231F', lineHeight: 1.4 }} className="line-clamp-2">
          {auction.title}
        </h3>
        <span style={{ display: 'inline-block', background: '#E4F3E8', color: '#287A52', fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.6rem', borderRadius: '9999px', alignSelf: 'flex-start' }}>
          {auction.category}
        </span>

        {/* Price row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid #F3F4F6' }}>
          <div>
            <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginBottom: '0.1rem' }}>
              {auction.bidCount > 0 ? 'Current bid' : 'Starting at'}
            </p>
            <p style={{ fontSize: '1.15rem', fontWeight: 700, color: '#287A52' }}>
              ₹{price.toLocaleString('en-IN')}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#9CA3AF', justifyContent: 'flex-end', marginBottom: '0.2rem' }}>
              <Gavel size={11} /> {auction.bidCount} bids
            </div>
            {auction.status === 'ACTIVE' && <Countdown closingTime={auction.closingTime} compact />}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#9CA3AF' }}>
          <User size={11} />
          <span>{auction.sellerName}</span>
        </div>
      </div>
    </div>
  );
}
