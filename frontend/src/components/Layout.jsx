import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const sessionStr = localStorage.getItem('local_session');
    if (!sessionStr) {
      navigate('/');
    } else {
      try {
        const sessionUser = JSON.parse(sessionStr);
        setUser(sessionUser);
      } catch(e) {
        navigate('/');
      }
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="auth-container">
        <div className="orb-1"></div>
        <div className="orb-2"></div>
        <div className="glass-panel">
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout app-wrapper">
      <div className="orb-1" style={{ top: '20vh', left: '-5vw' }}></div>
      <div className="orb-2" style={{ bottom: '10vh', right: '10vw' }}></div>
      
      <Sidebar />

      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
