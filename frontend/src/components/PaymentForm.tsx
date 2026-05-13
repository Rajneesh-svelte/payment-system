import React, { useState } from 'react';
import { CreditCard, Send, RefreshCw } from 'lucide-react';
import api from '../utils/api';

interface PaymentFormProps {
  onPaymentInitiated: (payment: any) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onPaymentInitiated }) => {
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/payments', {
        amount: parseFloat(amount),
        currency,
        idempotencyKey
      });
      onPaymentInitiated(response.data);
      // Reset form but keep key fresh for next one or reset it
      setAmount('');
      setIdempotencyKey(crypto.randomUUID());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const regenerateKey = () => setIdempotencyKey(crypto.randomUUID());

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <CreditCard className="text-accent-primary" size={24} style={{ color: 'var(--accent-primary)' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Initiate Payment</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            min="0.01"
            step="0.01"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              color: 'white',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              color: 'white',
              fontSize: '1rem',
              outline: 'none',
              appearance: 'none'
            }}
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="INR">INR - Indian Rupee</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Idempotency Key</label>
            <button 
              type="button" 
              onClick={regenerateKey}
              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <RefreshCw size={12} /> Regenerate
            </button>
          </div>
          <input
            type="text"
            value={idempotencyKey}
            readOnly
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--glass-border)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              cursor: 'not-allowed'
            }}
          />
        </div>

        {error && (
          <div style={{ color: 'var(--error)', fontSize: '0.875rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
        >
          {loading ? <RefreshCw className="animate-spin" size={20} /> : <><Send size={20} /> Pay Now</>}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;
