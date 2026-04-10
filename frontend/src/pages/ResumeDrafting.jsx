import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Save, Trash2, FileText, Download } from 'lucide-react';
import API_BASE_URL from '../apiConfig';

export default function ResumeDrafting() {
  const [userId, setUserId] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [baseResume, setBaseResume] = useState("");

  const [savedDocs, setSavedDocs] = useState([]);
  const [saveTitle, setSaveTitle] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const sessionStr = localStorage.getItem('local_session');
    if (sessionStr) {
      try {
        const sessionUser = JSON.parse(sessionStr);
        setUserId(sessionUser.id);
        fetchProfile(sessionUser.id);
        fetchSavedDocs(sessionUser.id);
      } catch (e) {
        console.error("Session parse error", e);
      }
    }
  }, []);

  const fetchProfile = async (uid) => {
    try {
      const res = await fetch(`${API_BASE_URL}/profile?user_id=${uid}`);
      const data = await res.json();
      if (data && data.base_resume) {
        setBaseResume(data.base_resume);
      }
    } catch(e) {
      console.error("Profile fetch error", e);
    }
  };

  const fetchSavedDocs = async (uid) => {
    try {
      const res = await fetch(`${API_BASE_URL}/artifacts?user_id=${uid}&artifact_type=resume`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedDocs(data);
      }
    } catch (e) {
      console.error("Artifacts fetch error", e);
    }
  };

  const handleOptimize = async () => {
    if (!jobDescription.trim()) return;
    setLoading(true);
    setResumeData(null);
    try {
      const response = await fetch(`${API_BASE_URL}/resume/optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: userId || 'anonymous', 
          original_resume: baseResume || 'No resume content provided.', 
          target_job_description: jobDescription, 
          hiring_manager_linkedin: linkedin 
        })
      });
      const data = await response.json();
      setResumeData(data);
    } catch(e) {
      console.error("Optimize fetch error", e);
    }
    setLoading(false);
  };

  const handleSaveDocument = async () => {
    if (!saveTitle.trim() || !resumeData?.optimized_resume) return;
    setSaving(true);
    try {
      await fetch(`${API_BASE_URL}/artifacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          artifact_type: "resume",
          title: saveTitle,
          content: resumeData.optimized_resume
        })
      });
      if (userId) fetchSavedDocs(userId);
      setSaveTitle("");
    } catch(e) {
      console.error("Save error", e);
    }
    setSaving(false);
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await fetch(`${API_BASE_URL}/artifacts/${docId}`, { method: "DELETE" });
      if (userId) fetchSavedDocs(userId);
    } catch(e) {
      console.error("Delete error", e);
    }
  };

  return (
    <Layout>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem', alignItems: 'start' }}>
        
        {/* Left Column: Generator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>
              Resumes
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>Optimize your base resume to beat the ATS using Grok's deep reasoning.</p>
          </div>

          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
            {baseResume ? (
              <p style={{ color: '#10b981', fontSize: '0.875rem' }}>✓ Base Resume loaded from profile.</p>
            ) : (
              <p style={{ color: '#fbbf24', fontSize: '0.875rem' }}>⚠ Warning: No Base Resume found in Dashboard profile.</p>
            )}
            <textarea 
              placeholder="Paste Target Job Description here..." 
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              style={{ width: '100%', height: '150px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', padding: '1rem', borderRadius: '8px' }}
            />
            <input 
              type="text" 
              placeholder="Target Hiring Manager LinkedIn URL (optional)" 
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', padding: '1rem', borderRadius: '8px' }}
            />
            <button className="btn-primary" onClick={handleOptimize} disabled={loading || !jobDescription.trim()}>
              {loading ? "Optimizing..." : "Analyze & Optimize"}
            </button>
          </div>

          {resumeData && resumeData.optimized_resume && (
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Optimized Resume</h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Name this version..." 
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '4px', color: 'white' }}
                  />
                  <button onClick={handleSaveDocument} disabled={saving || !saveTitle.trim()} className="btn-primary" style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Save size={16} /> Save
                  </button>
                </div>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', color: '#e2e8f0', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                {resumeData.optimized_resume}
              </pre>
            </div>
          )}
        </div>

        {/* Right Column: Saved Documents Library */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <FileText size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Saved Versions</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {savedDocs && savedDocs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>No saved resumes yet.</p>
            ) : (
              savedDocs && savedDocs.map(doc => (
                <div key={doc.id} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontWeight: '500', fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</h3>
                    <button onClick={() => handleDeleteDocument(doc.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}</p>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button onClick={() => {
                        const blob = new Blob([doc.content || ''], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${doc.title || 'resume'}.txt`;
                        a.click();
                      }} 
                      style={{ flex: 1, background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '4px', padding: '0.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                      <Download size={14} /> Download (.txt)
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
