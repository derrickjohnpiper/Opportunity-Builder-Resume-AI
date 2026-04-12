import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { BrainCircuit, Link as LinkIcon, RefreshCw, Crosshair, Activity, Lock } from 'lucide-react';
import API_BASE_URL from '../apiConfig';

export default function Insights() {
  const [userId, setUserId] = useState(null);
  const [fullProfile, setFullProfile] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  // Personality Test State
  const [testMode, setTestMode] = useState(false);
  const [activeTest, setActiveTest] = useState(null); // 'ocean', 'disc', 'jungian'
  
  const [oceanAnswers, setOceanAnswers] = useState({ q1: 3, q2: 3, q3: 3, q4: 3, q5: 3 }); // 1-5 scale
  const [discAnswers, setDiscAnswers] = useState({ q1: '', q2: '', q3: '', q4: '' });
  const [jungianAnswers, setJungianAnswers] = useState({ q1: '', q2: '', q3: '' });

  const [personalityProfile, setPersonalityProfile] = useState('');
  const [evaluating, setEvaluating] = useState(false);

  // Hiring Manager State
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [managerProfile, setManagerProfile] = useState('');
  const [strategy, setStrategy] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const sessionStr = localStorage.getItem('local_session');
    if (sessionStr) {
      const sessionUser = JSON.parse(sessionStr);
      setUserId(sessionUser.id);
      fetchProfile(sessionUser.id);
    }
  }, []);

  const fetchProfile = async (uid) => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile?user_id=${uid}`);
      const data = await res.json();
      setFullProfile(data);
      if (data.personality_profile) {
        setPersonalityProfile(data.personality_profile);
      }
    } catch(e) {}
    setLoadingInitial(false);
  };

  const saveProfileString = async (newProfile) => {
    try {
      await fetch(`${API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fullProfile, personality_profile: newProfile })
      });
      setPersonalityProfile(newProfile);
      setFullProfile({...fullProfile, personality_profile: newProfile});
    } catch(e) { console.error('Save profile err:', e); }
  };

  const handleSubmitTest = async () => {
    setEvaluating(true);
    try {
      const payload = {
        ocean: oceanAnswers,
        disc: discAnswers,
        jungian: jungianAnswers
      };

      const response = await fetch(`${API_BASE_URL}/personality/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload })
      });
      const data = await response.json();
      await saveProfileString(data.profile);
      setTestMode(false);
    } catch(e) {
      console.error(e);
    }
    setEvaluating(false);
  };

  const handleAnalyzeManager = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/insights/manager-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedin_url: linkedinUrl, user_id: userId })
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.detail || "API Failure");
      
      setManagerProfile(data.manager_analysis);
      setStrategy(data.communication_strategy);
    } catch(e) {
      setError(e.message || "Failed to analyze LinkedIn");
    }
    setAnalyzing(false);
  };

  if (loadingInitial) return <Layout><p>Loading...</p></Layout>;

  // PAYWALL RENDER
  if (!fullProfile || fullProfile.subscription_tier !== 'premium') {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', textAlign: 'center' }}>
          <Lock size={64} color="var(--accent)" style={{ marginBottom: '1.5rem', opacity: 0.8 }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Exclusive Insights Engine
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', lineHeight: '1.6', marginBottom: '2rem' }}>
            Unlock the power of deep psychological profiling. Analyze your personality traits instantly against Hiring Managers to generate a pinpoint accurate execution strategy to dominate your interviews.
          </p>
          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid var(--accent)' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'white' }}>Upgrade to Premium Workspace</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Normally this requires a subscription, but because we are inside the offline sandbox, you can toggle Premium on and off via the <strong style={{color:'white'}}>Settings</strong> button on the Dashboard.
            </p>
            <button onClick={() => window.location.href='/dashboard'} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Go to Dashboard To Unlock
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // PREMIUM ACCESSED RENDER
  return (
    <Layout>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Psychological Strategy Engine</h1>
          <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></span>
            Premium Unlocked
            <span style={{ fontSize: '0.7rem', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>TESTING MODE UNLOCKED</span>
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Side: Your Personality Generator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <BrainCircuit size={24} color="var(--accent)" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Your Behavioral Profile</h2>
            </div>
            
            {testMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Take any or all of the psych tests below. The AI will aggregate your answers.</p>
                
                {/* test selector */}
                <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                  <button onClick={() => setActiveTest('ocean')} className="btn-primary" style={{ background: activeTest === 'ocean' ? 'var(--accent)' : 'transparent', color: activeTest === 'ocean' ? 'white' : 'var(--text-muted)', padding: '0.5rem 1rem' }}>Big Five (OCEAN)</button>
                  <button onClick={() => setActiveTest('disc')} className="btn-primary" style={{ background: activeTest === 'disc' ? 'var(--accent)' : 'transparent', color: activeTest === 'disc' ? 'white' : 'var(--text-muted)', padding: '0.5rem 1rem' }}>DISC Profile</button>
                  <button onClick={() => setActiveTest('jungian')} className="btn-primary" style={{ background: activeTest === 'jungian' ? 'var(--accent)' : 'transparent', color: activeTest === 'jungian' ? 'white' : 'var(--text-muted)', padding: '0.5rem 1rem' }}>Jungian Cognitive</button>
                </div>

                {!activeTest && (
                  <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Select a test above to begin mapping your profile.
                  </div>
                )}

                {activeTest === 'ocean' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'scaleUp 0.2s ease-out' }}>
                    <h3 style={{ color: 'white', fontWeight: 'bold' }}>Big Five Questionnaire (1-5 Scale)</h3>
                    {[
                      { key: 'q1', label: '1. I am highly imaginative and open to radical new ideas.' },
                      { key: 'q2', label: '2. I am organized, structured, and highly motivated.' },
                      { key: 'q3', label: '3. I draw massive energy from social/group interactions.' },
                      { key: 'q4', label: '4. I am typically highly empathetic towards others.' },
                      { key: 'q5', label: '5. I am very reactive to stressful negative emotional states.' }
                    ].map(q => (
                      <div key={q.key}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>{q.label}</label>
                        <input type="range" min="1" max="5" value={oceanAnswers[q.key]} onChange={e => setOceanAnswers({...oceanAnswers, [q.key]: e.target.value})} style={{ width: '100%', cursor: 'pointer' }}/>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}><span>Strongly Disagree</span><span>Strongly Agree</span></div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTest === 'disc' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'scaleUp 0.2s ease-out' }}>
                    <h3 style={{ color: 'white', fontWeight: 'bold' }}>DISC Assessment</h3>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem' }}>1. When communicating, do you prioritize blunt factual efficiency, or warm relationship-building data?</label>
                    <textarea value={discAnswers.q1} onChange={e=>setDiscAnswers({...discAnswers, q1: e.target.value})} className="glass-panel" style={{ width: '100%', height: '50px', padding: '0.5rem', color: 'white' }} />
                    
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem' }}>2. Under intense workplace pressure, do you seize direct control or seek consensus?</label>
                    <textarea value={discAnswers.q2} onChange={e=>setDiscAnswers({...discAnswers, q2: e.target.value})} className="glass-panel" style={{ width: '100%', height: '50px', padding: '0.5rem', color: 'white' }} />
                  </div>
                )}

                {activeTest === 'jungian' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'scaleUp 0.2s ease-out' }}>
                    <h3 style={{ color: 'white', fontWeight: 'bold' }}>Jungian Cognitive Framework</h3>
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem' }}>1. Do you analyze problems via broad abstract intuitions or harsh concrete data?</label>
                    <textarea value={jungianAnswers.q1} onChange={e=>setJungianAnswers({...jungianAnswers, q1: e.target.value})} className="glass-panel" style={{ width: '100%', height: '50px', padding: '0.5rem', color: 'white' }} />
                    
                    <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.875rem' }}>2. Do you make decisions via strict cold logical frameworks, or a feeling-based values system?</label>
                    <textarea value={jungianAnswers.q2} onChange={e=>setJungianAnswers({...jungianAnswers, q2: e.target.value})} className="glass-panel" style={{ width: '100%', height: '50px', padding: '0.5rem', color: 'white' }} />
                  </div>
                )}

                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button onClick={() => setTestMode(false)} className="btn-primary" style={{ background: 'transparent' }}>Cancel</button>
                  <button onClick={handleSubmitTest} disabled={evaluating} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#10b981', color: 'white' }}>
                    {evaluating ? <RefreshCw className="animate-spin" size={18} /> : null}
                    {evaluating ? 'Aggregating via AI...' : 'Generate Mega-Profile'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {personalityProfile ? (
                  <>
                    <p style={{ color: 'var(--text-color)', lineHeight: '1.6', marginBottom: '1.5rem', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)', borderLeft: '4px solid #10b981' }}>
                      {personalityProfile}
                    </p>
                    <button onClick={() => setTestMode(true)} className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}>Retake Assessments</button>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No personality profile formulated.</p>
                    <button onClick={() => { setTestMode(true); setActiveTest('ocean'); }} className="btn-primary">Initialize Diagnostic</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Manager Strategy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Crosshair size={24} color="#ef4444" />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Hiring Manager Target Planner</h2>
            </div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Submit the LinkedIn URL of your target hiring manager. The AI will parse their profile, identify their communication traits, and cross-reference them with your personality profile to formulate a <strong>direct execution strategy</strong>.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <LinkIcon size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/hiring-manager" 
                  style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }} 
                />
              </div>
              <button onClick={handleAnalyzeManager} disabled={analyzing || !linkedinUrl.trim()} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ef4444', border: '1px solid #ef4444' }}>
                {analyzing ? <RefreshCw className="animate-spin" size={18} /> : 'Lock Target'}
              </button>
            </div>
            
            {error && <p style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</p>}
          </div>

          {strategy && (
            <div className="glass-panel" style={{ padding: '2rem', animation: 'scaleUp 0.3s ease-out' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <Activity size={20} color="#10b981" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Execution Strategy Blueprint</h3>
               </div>
               
               <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Target Persona Analysis</p>
               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--glass-border)', marginBottom: '1.5rem' }}>
                 <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '0.9rem', color: '#e2e8f0' }}>{managerProfile}</p>
               </div>

               <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Your Tactical Execution</p>
               <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderLeft: '4px solid #10b981', padding: '1.25rem', borderRadius: '8px' }}>
                 <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem', color: '#ecfdf5' }}>{strategy}</p>
               </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
