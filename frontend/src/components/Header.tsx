import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1.5rem 0',
      borderBottom: '1px solid var(--glass-border)',
      marginBottom: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          padding: '0.5rem',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldCheck size={24} color="white" />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          SecurePay <span style={{ fontWeight: 300, color: 'var(--text-secondary)' }}>Pro</span>
        </h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          background: 'rgba(16, 185, 129, 0.1)', 
          padding: '0.5rem 1rem', 
          borderRadius: '9999px',
          fontSize: '0.875rem',
          color: 'var(--success)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}>
          <Activity size={16} />
          System Live
        </div>
      </div>
    </header>
  );
};

export default Header;
