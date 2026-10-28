export default function StatusBadge({ status }) {
  const styles = {
    ACTIVE: { bg: '#DCFCE7', color: '#15803D' },
    PENDING_SELLER_APPROVAL: { bg: '#FEF9C3', color: '#A16207' },
    RESERVED: { bg: '#DBEAFE', color: '#1D4ED8' },
    SOLD: { bg: '#F3F4F6', color: '#374151' },
    UNSOLD: { bg: '#F3F4F6', color: '#6B7280' },
    REJECTED: { bg: '#FEE2E2', color: '#DC2626' },
    CANCELLED: { bg: '#F3F4F6', color: '#6B7280' },
    FAILED_PICKUP: { bg: '#FFEDD5', color: '#C2410C' },
  };
  const labels = {
    ACTIVE: 'Active',
    PENDING_SELLER_APPROVAL: 'Awaiting Seller',
    RESERVED: 'Reserved',
    SOLD: 'Sold',
    UNSOLD: 'Unsold',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    FAILED_PICKUP: 'Failed Pickup',
  };
  const s = styles[status] || { bg: '#F3F4F6', color: '#6B7280' };
  return (
    <span className="badge" style={{ backgroundColor: s.bg, color: s.color }}>
      {labels[status] || status}
    </span>
  );
}
