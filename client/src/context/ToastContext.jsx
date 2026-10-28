import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const iconMap = { success: CheckCircle, error: XCircle, info: AlertCircle };
  const colorMap = {
    success: 'border-green-200 text-green-800',
    error: 'border-red-200 text-red-800',
    info: 'border-blue-200 text-blue-800',
  };
  const iconColorMap = { success: 'text-green-500', error: 'text-red-500', info: 'text-blue-500' };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem', maxWidth: '360px' }}>
        {toasts.map(t => {
          const Icon = iconMap[t.type] || AlertCircle;
          return (
            <div key={t.id} className={`card ${colorMap[t.type] || ''}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', border: '1px solid', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <Icon size={18} className={iconColorMap[t.type]} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span style={{ fontSize: '0.875rem', flex: 1 }}>{t.message}</span>
              <button onClick={() => removeToast(t.id)} style={{ color: '#9CA3AF', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
