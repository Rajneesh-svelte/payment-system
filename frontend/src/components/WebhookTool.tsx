import React, { useState } from 'react';
import { Terminal, Play, CheckCircle, RefreshCw } from 'lucide-react';
import api from '../utils/api';

const WebhookTool: React.FC<{ lastPaymentId?: string }> = ({ lastPaymentId }) => {
  const [paymentId, setPaymentId] = useState(lastPaymentId || '');
  const [status, setStatus] = useState('SUCCESS');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  React.useEffect(() => {
    if (lastPaymentId) setPaymentId(lastPaymentId);
  }, [lastPaymentId]);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    try {
      await api.post('/webhooks/gateway', {
        paymentId,
        status,
        providerId: `manual_${Math.random().toString(36).substr(2, 5)}`
      });
      setResult('Webhook delivered successfully!');
    } catch (err: any) {
      setResult(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Terminal style={{ color: 'var(--accent-secondary)' }} size={20} />
        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Webhook Simulator</h3>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target Payment ID</label>
          <input
            type="text"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            placeholder="uuid-here..."
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              color: 'white',
              fontSize: '0.875rem'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              color: 'white',
              fontSize: '0.875rem'
            }}
          >
            <option value="SUCCESS">SUCCESS</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <button 
          onClick={handleSimulate}
          disabled={loading || !paymentId}
          className="btn"
          style={{ background: 'rgba(168, 85, 247, 0.2)', color: 'var(--accent-secondary)', border: '1px solid rgba(168, 85, 247, 0.3)' }}
        >
          {loading ? <RefreshCw className="animate-spin" size={16} /> : <><Play size={16} /> Trigger</>}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: result.includes('Error') ? 'var(--error)' : 'var(--success)' }}>
          <CheckCircle size={14} />
          {result}
        </div>
      )}
    </div>
  );
};

export default WebhookTool;
