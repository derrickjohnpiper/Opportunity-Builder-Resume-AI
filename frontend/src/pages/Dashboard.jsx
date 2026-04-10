import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Settings, Search, MapPin, DollarSign, Filter, RefreshCw } from 'lucide-react';
import API_BASE_URL from '../apiConfig';


export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState(null);
  const [savingJobs, setSavingJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [fullProfile, setFullProfile] = useState(null);
  
  // Auto-scoring State
  const [baseResume, setBaseResume] = useState('');
  const [scoringJobs, setScoringJobs] = useState(new Set());

  // Filters State
  const [filters, setFilters] = useState({
    keywords: '',
    city: '',
    state: '',
    salary_min: ''
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const sessionStr = localStorage.getItem('local_session');
    if (sessionStr) {
      const sessionUser = JSON.parse(sessionStr);
      setUserId(sessionUser.id);
      fetchJobs(sessionUser.id);
      
      try {
        const res = await fetch(`${API_BASE_URL}/profile?user_id=${sessionUser.id}`);
        const profileData = await res.json();
        setFullProfile(profileData);
        if (profileData.base_resume) {
          setBaseResume(profileData.base_resume);
        }
      } catch (e) {}
    }
  };

  const fetchJobs = async (uid) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs?user_id=${uid}`);
      const data = await response.json();
      setJobs(data);
    } catch (e) {
      console.error("Failed to fetch jobs", e);
    }
    setLoading(false);
  };

  const handleSaveResume = async () => {
    try {
      await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          full_name: fullProfile?.name || 'Local User',
          base_resume: baseResume,
          subscription_tier: fullProfile?.subscription_tier || 'free'
        })
      });
    } catch(e) {
      console.error(e);
    }
  };

  const scoreJob = async (jobId) => {
    setScoringJobs(prev => new Set(prev).add(jobId));
    try {
      const res = await fetch(`${API_BASE_URL}/jobs/${jobId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: baseResume })
      });
      const data = await res.json();
      
      setJobs(prevJobs => prevJobs.map(j => j.id === jobId ? { ...j, compatibility_score: data.score } : j));
    } catch(e) {
      console.error(e);
    }
    setScoringJobs(prev => {
      const newSet = new Set(prev);
      newSet.delete(jobId);
      return newSet;
    });
  };

  useEffect(() => {
    if (baseResume && jobs.length > 0) {
      const unscored = jobs.find(j => j.compatibility_score === null && !scoringJobs.has(j.id));
      if (unscored) {
        scoreJob(unscored.id);
      }
    }
  }, [jobs, baseResume, scoringJobs]);

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/jobs/aggregate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          filters: filters,
          limit: 20
        })
      });
      
      const data = await response.json();
      
      if (response.status === 429) {
        setError(data.detail);
      } else if (data.status === 'success') {
        fetchJobs(userId);
      } else if (data.status === 'error') {
        setError(data.message);
      }
    } catch (e) {
      console.error("Aggregation failed", e);
      setError("Failed to connect to scanner. Is the server running?");
    }
    setScanning(false);
  };

  const handleSaveJob = async (job) => {
    setSavingJobs(prev => [...prev, job.id]);
    try {
      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(), // Optional depending on how the backend generates it, but since backend uses it to insert... wait let backend handle ID or send it. I'll send it.
          user_id: userId,
          job_id: job.id,
          company: job.company,
          title: job.title,
          status: 'Saved',
          notes: job.description?.substring(0, 50) + '...'
        })
      });
      if (!response.ok) throw new Error("API failure");
      
      // Opt: show toast or something
      // Remote from local state:
      setJobs(prev => prev.filter(j => j.id !== job.id));
    } catch (e) {
      console.error("Failed to save to tracker", e);
      setError("Failed to save job to tracker.");
    }
    setSavingJobs(prev => prev.filter(id => id !== job.id));
  };
  
  const handleDeleteJob = async (jobId) => {
    try {
      await fetch(`${API_BASE_URL}/jobs/${jobId}`, { method: 'DELETE' });
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setSelectedJob(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e) => {

    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleTogglePremium = async () => {
    if (!fullProfile) return;
    const newTier = fullProfile.subscription_tier === 'premium' ? 'free' : 'premium';
    
    try {
      await fetch('http://localhost:8001/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          full_name: fullProfile.name,
          base_resume: fullProfile.base_resume,
          personality_profile: fullProfile.personality_profile,
          subscription_tier: newTier
        })
      });
      setFullProfile({...fullProfile, subscription_tier: newTier});
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Opportunity Feed</h1>
          <p style={{ color: 'var(--text-muted)' }}>Daily curated roles powered by Grok AI</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setShowSettings(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={18} /> Settings
          </button>
        </div>
      </div>

      {/* Base Resume Box */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '500', marginBottom: '0.5rem' }}>Auto-Scoring Resume Context</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>Paste your current resume here to automatically grade all incoming job opportunities in your feed.</p>
        <textarea 
          value={baseResume}
          onChange={(e) => setBaseResume(e.target.value)}
          placeholder="Paste your base resume text here..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '1rem',
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--glass-border)',
            borderRadius: '8px',
            color: 'white',
            marginBottom: '1rem',
            resize: 'vertical'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSaveResume} className="btn-primary" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}>
            Save Resume Context
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem', padding: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            name="keywords"
            placeholder="Keywords (e.g. React)" 
            value={filters.keywords}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }} 
          />
        </div>
        <div style={{ position: 'relative' }}>
          <MapPin size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            name="city"
            placeholder="City" 
            value={filters.city}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }} 
          />
        </div>
        <div style={{ position: 'relative' }}>
          <MapPin size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            name="state"
            placeholder="State / Remote" 
            value={filters.state}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }} 
          />
        </div>
        <div style={{ position: 'relative' }}>
          <DollarSign size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="number" 
            name="salary_min"
            placeholder="Min Salary ($)" 
            value={filters.salary_min}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }} 
          />
        </div>
        <button onClick={handleScan} disabled={scanning} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {scanning ? <RefreshCw className="animate-spin" size={18} /> : <Filter size={18} />}
          {scanning ? 'Scanning...' : 'Scan Now'}
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '0.75rem 1.5rem', marginBottom: '2rem', border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p>{error}</p>
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
      )}

      {/* Job Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading && jobs.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Loading your feed...</p>
        ) : jobs.length > 0 ? (
          jobs.map((job) => (
            <div key={job.id} className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', transition: 'transform 0.2s' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{job.title}</h3>
                <p style={{ color: 'var(--accent)', fontWeight: '500', marginBottom: '0.5rem' }}>{job.company}</p>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  <span>{new Date(job.posted_date).toLocaleDateString()}</span>
                  {scoringJobs.has(job.id) ? (
                    <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <RefreshCw size={14} className="animate-spin" /> Auto-Scoring...
                    </span>
                  ) : (
                    <span style={{ color: job.compatibility_score ? '#10b981' : 'var(--text-muted)' }}>
                      {job.compatibility_score ? `${job.compatibility_score}% Match` : 'Unscored'}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setSelectedJob(job)} className="btn-primary" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)', boxShadow: 'none' }}>
                  View Details
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => handleSaveJob(job)}
                  disabled={savingJobs.includes(job.id)}
                >
                  {savingJobs.includes(job.id) ? 'Saving...' : 'Save to Tracker'}
                </button>
                <button onClick={() => handleDeleteJob(job.id)} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', boxShadow: 'none' }}>
                  Hide
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No opportunities found.</p>
            <p style={{ color: 'var(--text-muted)' }}>Adjust your filters and click "Scan Now" to populate your feed.</p>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedJob && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            <button onClick={() => setSelectedJob(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{selectedJob.title}</h2>
            <p style={{ color: 'var(--accent)', fontWeight: '500', marginBottom: '0.5rem' }}>{selectedJob.company}</p>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              <span>{new Date(selectedJob.posted_date).toLocaleDateString()}</span>
              <span>{selectedJob.compatibility_score ? `${selectedJob.compatibility_score}% Match` : 'Unscored'}</span>
            </div>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Job Description</h3>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', color: 'var(--text-color)', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {selectedJob.description}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button onClick={() => handleDeleteJob(selectedJob.id)} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444' }}>Delete Post</button>
              <button onClick={() => { handleSaveJob(selectedJob); setSelectedJob(null); }} className="btn-primary">Save to Tracker</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '90%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
             <button onClick={() => setShowSettings(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
             <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={20} /> Settings</h2>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <div>
                 <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Workspace ID</label>
                 <input type="text" readOnly value={userId} className="glass-panel" style={{ width: '100%', padding: '0.75rem', color: 'var(--text-muted)' }} />
               </div>
               <div>
                 <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>MOCK PAYWALL TESTER</label>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: 'white', fontWeight: '500' }}>Premium Subscription</p>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Toggle this to unlock the Insights Paywall.</p>
                    </div>
                    <button onClick={handleTogglePremium} style={{ background: fullProfile?.subscription_tier === 'premium' ? '#10b981' : '#4b5563', padding: '0.5rem 1rem', borderRadius: '20px', color: 'white', border: 'none', cursor: 'pointer', transition: 'background 0.3s' }}>
                      {fullProfile?.subscription_tier === 'premium' ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                 </div>
               </div>
               
               <div>
                 <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Data Management</label>
                 <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>All data is saved locally on your device in the SQLite database.</p>
                 <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="btn-primary" style={{ background: 'rgba(239, 68, 68, 0.2)', width: '100%', color: '#fca5a5' }}>Sign Out / Clear Session</button>
               </div>
             </div>
          </div>
        </div>
      )}

    </Layout>
  );
}
