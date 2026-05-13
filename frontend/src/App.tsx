import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import PaymentForm from './components/PaymentForm';
import api from './utils/api';
import { CheckCircle2, XCircle, Clock, RefreshCw, Copy, Play, AlertCircle, CheckCircle } from 'lucide-react';
import type { Payment } from './components/PaymentList';

// --- Toast Component ---
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClear: () => void }> = ({ message, type, onClear }) => {
  useEffect(() => {
    const timer = setTimeout(onClear, 4000);
    return () => clearTimeout(timer);
  }, [onClear]);

  return (
    <div className="toast animate-fade-in">
      {type === 'success' ? <CheckCircle size={18} color="var(--success)" /> : <AlertCircle size={18} color="var(--error)" />}
      <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{message}</span>
    </div>
  );
};

function App() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handlePaymentInitiated = (newPayment: Payment) => {
    setPayments(prev => [newPayment, ...prev]);
    addToast('Payment initiated successfully');
  };

  // Fetch all payments on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await api.get('/payments');
        setPayments(res.data);
      } catch (err) {
        console.error('Failed to fetch payments', err);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="app-container">
      <Header />

      <div className="toast-container">
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClear={() => removeToast(t.id)} />
        ))}
      </div>

      <main className="dashboard-grid">
        <section className="animate-fade-in">
          <PaymentForm onPaymentInitiated={handlePaymentInitiated} />

          <div className="glass-card" style={{ padding: '1.5rem', marginTop: '2rem', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> Points
            </h3>
            <ul style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', paddingLeft: '1.25rem', lineHeight: '1.6' }}>
              <li>Initiate a payment to see it appear in real-time.</li>
              <li>Use the <b>contextual actions</b> in the list to simulate gateway callbacks.</li>
              <li>Polling automatically syncs status every 2 seconds.</li>
            </ul>
          </div>
        </section>

        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="glass-card" style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <PaymentListInternal payments={payments} setPayments={setPayments} addToast={addToast} />
          </div>
        </section>
      </main>

    </div>
  );
}

// --- Enhanced Payment List ---
const PaymentListInternal: React.FC<{
  payments: Payment[],
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>,
  addToast: (msg: string, type?: 'success' | 'error') => void
}> = ({ payments, setPayments, addToast }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPayments = payments.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      const activePayments = payments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING');

      if (activePayments.length === 0) return;

      try {
        const res = await api.get('/payments');
        const updatedPayments = res.data;

        // Check for state changes to trigger "glow" or notifications
        updatedPayments.forEach((newP: Payment) => {
          const oldP = payments.find(p => p.id === newP.id);
          if (oldP && oldP.status !== newP.status) {
            if (newP.status === 'SUCCESS') addToast(`Payment ${newP.id.substring(0, 8)} Succeeded`);
            if (newP.status === 'FAILED') addToast(`Payment ${newP.id.substring(0, 8)} Failed`, 'error');
          }
        });

        setPayments(updatedPayments);
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [payments, setPayments, addToast]);

  const handleSimulateWebhook = async (id: string, status: 'SUCCESS' | 'FAILED') => {
    try {
      await api.post('/webhooks/gateway', {
        paymentId: id,
        status,
        providerId: `sim_${Math.random().toString(36).substring(7)}`
      });
      addToast(`Simulated ${status} callback sent`);
    } catch (err: any) {
      addToast('Simulation failed', 'error');
    }
  };

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
              <th style={{ padding: '1rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <p>No payments initiated yet.</p>
                </td>
              </tr>
            ) : (
              paginatedPayments.map((payment) => (
                <tr key={payment.id} className="animate-fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '1rem 0.5rem' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      #{payment.id.substring(0, 8)}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(payment.id);
                          addToast('ID copied to clipboard');
                        }}
                        className="action-btn"
                        title="Copy Full ID"
                      >
                        <Copy size={12} />
                      </button>
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
                    {payment.lastError && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--error)', marginTop: '0.25rem', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={payment.lastError}>
                        {payment.lastError}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                    {(payment.status === 'PENDING' || payment.status === 'PROCESSING') && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleSimulateWebhook(payment.id, 'SUCCESS')}
                          className="action-btn success"
                          title="Simulate Success Webhook"
                        >
                          <Play size={12} />
                        </button>
                        <button
                          onClick={() => handleSimulateWebhook(payment.id, 'FAILED')}
                          className="action-btn error"
                          title="Simulate Failure Webhook"
                        >
                          <AlertCircle size={12} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Page {currentPage} of {totalPages} ({payments.length} items)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="action-btn"
              style={{ opacity: currentPage === 1 ? 0.3 : 1, pointerEvents: currentPage === 1 ? 'none' : 'auto' }}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="action-btn"
              style={{ opacity: currentPage === totalPages ? 0.3 : 1, pointerEvents: currentPage === totalPages ? 'none' : 'auto' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
