import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import PaymentForm from './components/PaymentForm';
import WebhookTool from './components/WebhookTool';
import api from './utils/api';
import { History, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import type { Payment } from './components/PaymentList';

function App() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [lastPaymentId, setLastPaymentId] = useState<string | undefined>();

  const handlePaymentInitiated = (newPayment: Payment) => {
    setPayments(prev => [newPayment, ...prev]);
    setLastPaymentId(newPayment.id);
  };

  // Sync with backend on mount (optional, if we had a list endpoint)
  // For now, we rely on local state for the session

  return (
    <div className="app-container">
      <Header />

      <main className="dashboard-grid">
        <section className="animate-fade-in">
          <PaymentForm onPaymentInitiated={handlePaymentInitiated} />
          <WebhookTool lastPaymentId={lastPaymentId} />
        </section>

        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* We pass the payments down to the list */}
          <div className="glass-card" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* I'll inline the list logic for simplicity or pass state */}
            <PaymentListInternal payments={payments} setPayments={setPayments} />
          </div>
        </section>
      </main>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem', paddingBottom: '2rem' }}>
        &copy; 2026 Antigravity Payment Systems. All transactions are simulated for testing purposes.
      </footer>
    </div>
  );
}

// Internal version of PaymentList that accepts props
const PaymentListInternal: React.FC<{
  payments: Payment[],
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>
}> = ({ payments, setPayments }) => {

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const activePayments = payments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING');

      if (activePayments.length === 0) return;

      const updatedPayments = await Promise.all(payments.map(async (p) => {
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

      // Only update if something changed
      if (JSON.stringify(updatedPayments) !== JSON.stringify(payments)) {
        setPayments(updatedPayments);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [payments, setPayments]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <CheckCircle2 size={16} color="var(--success)" />;
      case 'FAILED': return <XCircle size={16} color="var(--error)" />;
      case 'PROCESSING': return <RefreshCw size={16} className="animate-spin" color="var(--accent-primary)" />;
      default: return <Clock size={16} color="var(--warning)" />;
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <History style={{ color: 'var(--accent-primary)' }} size={24} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Recent Activity</h2>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left' }}>
              <th style={{ padding: '1rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ID / DATE</th>
              <th style={{ padding: '1rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>AMOUNT</th>
              <th style={{ padding: '1rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p>No payments initiated yet.</p>
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="animate-fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'monospace' }}>
                      #{payment.id.split('-')[0]}
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
                    <div className={`status-badge status-${payment.status.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
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
    </>
  );
};


export default App;
