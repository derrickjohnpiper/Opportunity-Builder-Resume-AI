import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import KanbanBoard from '../components/KanbanBoard';
import API_BASE_URL from '../apiConfig';

import { RefreshCw } from 'lucide-react';

export default function Tracker() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const sessionStr = localStorage.getItem('local_session');
    if (sessionStr) {
      const sessionUser = JSON.parse(sessionStr);
      setUserId(sessionUser.id);
      fetchApplications(sessionUser.id);
    }
  };

  const fetchApplications = async (uid) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/applications?user_id=${uid}`);
      if (!response.ok) throw new Error("API failure");
      const data = await response.json();
      setApplications(data || []);
    } catch (e) {
      console.error("Failed to fetch applications", e);
    }
    setLoading(false);
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Application Tracker</h1>
          <p style={{ color: 'var(--text-muted)' }}>Drag and drop to track your progress</p>
        </div>
        <button 
          onClick={() => fetchApplications(userId)} 
          className="glass-panel" 
          style={{ padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', border: '1px solid var(--glass-border)' }}
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && applications.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem' }}>Loading board...</p>
      ) : (
        <KanbanBoard 
          initialJobs={applications} 
          userId={userId} 
          onJobMove={() => fetchApplications(userId)} 
        />
      )}
    </Layout>
  );
}
