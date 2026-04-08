import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle, Search, Play } from 'lucide-react';
import { toast, Toaster } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resumeText, setResumeText] = useState("");

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${API}/jobs`);
      setJobs(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleScore = async (jobId) => {
    if (!resumeText) {
      toast.error("Please paste your resume below first to calculate compatibility.");
      return;
    }
    
    toast.info("Calculating compatibility score...");
    try {
      await axios.post(`${API}/jobs/${jobId}/score`, { resume_text: resumeText });
      fetchJobs();
      toast.success("Score updated!");
    } catch (err) {
      toast.error("Failed to calculate score.");
    }
  };

  const handleStatus = async (jobId, status) => {
    try {
      await axios.put(`${API}/jobs/${jobId}/status`, { status });
      fetchJobs();
      if (status === 'approved') {
        toast.success("Job Approved! Added to your App Tracker.");
      } else {
        toast.info("Job Rejected.");
      }
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const addMockJob = async () => {
    try {
      await axios.post(`${API}/jobs`, {
        title: "Senior Full Stack Developer",
        company: "InnovateTech Inc.",
        description: "We are looking for a Senior Developer experienced in React, Node.js, and Python. You will lead a team of 5 and architect scalable cloud solutions.",
        posted_date: new Date().toISOString()
      });
      fetchJobs();
      toast.success("Mock job aggregated from DoubleList.");
    } catch (err) {
        toast.error("Failed to add job.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Job Aggregator</h1>
          <p className="text-muted-foreground mt-1">Review new jobs and check compatibility before committing.</p>
        </div>
        <button 
          onClick={addMockJob}
          className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary-hover transition-colors shadow-sm flex items-center gap-2"
        >
          <Search size={18} />
          Scrape New Jobs
        </button>
      </div>

      <div className="bg-white border border-border p-6 rounded-md shadow-sm">
        <label className="block text-sm font-medium text-foreground mb-2">Base Resume (For Quick Compatibility Scoring)</label>
        <textarea 
          className="w-full h-24 bg-surface border border-border rounded-md p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          placeholder="Paste your current resume here to enable compatibility scoring..."
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-white border border-border border-dashed rounded-md">
          <p className="text-muted-foreground mb-4">No jobs aggregated yet.</p>
          <button onClick={addMockJob} className="bg-secondary text-secondary-foreground border border-border px-6 py-2 rounded-md hover:bg-surface_alt font-medium">
            Run Aggregator Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {jobs.filter(j => j.status === 'pending_review').map((job) => (
            <div key={job.id} className="bg-white border border-border rounded-md p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{job.title}</h3>
                  <p className="text-primary font-medium">{job.company}</p>
                  <p className="text-xs text-muted-foreground mt-1">Posted: {new Date(job.posted_date).toLocaleDateString()}</p>
                </div>
                
                <div className="flex flex-col items-end">
                  {job.compatibility_score ? (
                    <div className={`px-4 py-2 rounded-full font-bold text-sm border ${
                      job.compatibility_score >= 80 ? 'bg-accent-success/10 text-accent-success border-accent-success/20' : 
                      job.compatibility_score >= 60 ? 'bg-accent-warning/10 text-accent-warning border-accent-warning/20' : 
                      'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      {job.compatibility_score}% Match
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleScore(job.id)}
                      className="text-sm bg-surface hover:bg-surface_alt border border-border text-foreground px-3 py-1.5 rounded-md flex items-center gap-2"
                    >
                      <Play size={14} /> Calculate Score
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-surface rounded-md p-4 mb-6">
                <p className="text-sm text-foreground line-clamp-3">{job.description}</p>
              </div>
              
              <div className="flex items-center gap-3 border-t border-border/50 pt-4">
                <button 
                  onClick={() => handleStatus(job.id, 'approved')}
                  className="flex-1 bg-primary text-white font-medium py-2 rounded-md hover:bg-primary-hover transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} /> Approve & Optimize Resume
                </button>
                <button 
                  onClick={() => handleStatus(job.id, 'rejected')}
                  className="flex-1 bg-white border border-border text-foreground font-medium py-2 rounded-md hover:bg-surface transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={18} /> Pass
                </button>
              </div>
            </div>
          ))}
          {jobs.filter(j => j.status === 'pending_review').length === 0 && (
              <div className="text-center py-12 text-muted-foreground">All caught up! No pending jobs to review.</div>
          )}
        </div>
      )}
    </div>
  );
}