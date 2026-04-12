import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [profileName, setProfileName] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (profileName.trim()) {
      // Mock Local Auth Session
      const user = {
        id: 'local-user-' + profileName.toLowerCase().replace(/[^a-z0-9]/g, ''),
        name: profileName
      };
      localStorage.setItem('local_session', JSON.stringify(user));
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="orb-1"></div>
      <div className="orb-2"></div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', marginBottom: '1.5rem', border: '1px solid var(--accent)' }}>
          <Briefcase size={32} color="var(--accent)" />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem', textAlign: 'center' }}>
          Opportunity Builder
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', textAlign: 'center' }}>
          Resume AI
        </p>

        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Job Title or Name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '1rem'
              }}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '1rem', fontSize: '1rem', fontWeight: '600' }}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
