import React, { useEffect, useState } from 'react';
import { History, Search, CheckCircle2, XCircle, Clock, Loader2, Activity } from 'lucide-react';
import api from '../utils/api';

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  idempotencyKey: string;
  createdAt: string;
}

const PaymentList: React.FC<{ refreshTrigger: number }> = () => {


  // For the sake of the demo, let's store payments in local state 
  // and poll for status updates for any that are still PENDING or PROCESSING.
  const [localPayments, setLocalPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const activePayments = localPayments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING');
      
      if (activePayments.length === 0) return;

      const updatedPayments = await Promise.all(localPayments.map(async (p) => {
        if (p.status === 'PENDING' || p.status === 'PROCESSING') {
          try {
            const res = await api.get(`/payments/${p.id}`);
            return res.data;
          } catch (e) {
            return p;
          }
        }
        return p;
      }));

      setLocalPayments(updatedPayments);
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [localPayments]);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle2 size={16} className="text-success" />;
      case 'FAILED': return <XCircle size={16} className="text-error" />;
      case 'PROCESSING': return <Loader2 size={16} className="animate-spin text-accent-primary" />;
      default: return <Clock size={16} className="text-warning" />;
    }
  };

  const getStatusClass = (status: string) => `status-badge status-${status.toLowerCase()}`;

  return (
    <div className="glass-card" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <History style={{ color: 'var(--accent-primary)' }} size={24} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Recent Activity</h2>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search payments..."
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '9999px',
              padding: '0.4rem 1rem 0.4rem 2.25rem',
              color: 'white',
              fontSize: '0.875rem',
              width: '200px'
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: '300px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
              <th style={{ padding: '1rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ID / DATE</th>
              <th style={{ padding: '1rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>AMOUNT</th>
              <th style={{ padding: '1rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {localPayments.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Activity size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <p>No payments initiated yet.</p>
                </td>
              </tr>
            ) : (
              localPayments.map((payment) => (
                <tr key={payment.id} className="animate-fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                      #{payment.id.split('-')[0]}...
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(payment.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ fontWeight: 600 }}>
                      {payment.amount.toFixed(2)} {payment.currency}
                    </div>
                  </td>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div className={getStatusClass(payment.status)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// We need to expose a way to add payments to this list
export default PaymentList;
