import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function Countdown({ closingTime, compact = false }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = new Date(closingTime) - new Date();
      if (diff <= 0) {
        setTimeLeft('Ended');
        setUrgent(false);
        setEnded(true);
        return;
      }
      setEnded(false);
      setUrgent(diff <= 3600000); // < 1 hour → red
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 24) {
        const d = Math.floor(h / 24);
        setTimeLeft(`${d}d ${h % 24}h`);
      } else if (h > 0) {
        setTimeLeft(`${h}h ${m}m ${s}s`);
      } else {
        setTimeLeft(`${m}m ${s}s`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [closingTime]);

  if (compact) {
    return (
      <span style={{ fontSize: '0.75rem', fontWeight: 500, color: ended ? '#6B7280' : urgent ? '#EF4444' : '#6B7280' }}>
        {timeLeft}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.9rem', fontWeight: 600, color: ended ? '#6B7280' : urgent ? '#EF4444' : '#374151' }}>
      <Clock size={15} />
      <span>{timeLeft}</span>
    </div>
  );
}
