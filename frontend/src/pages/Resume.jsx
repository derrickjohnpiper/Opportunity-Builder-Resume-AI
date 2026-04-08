import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, Loader2, Save, FileText, Download } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import fileDownload from 'js-file-download';

export default function Resume() {
  const { api, user } = useAuth();
  
  const [formData, setFormData] = useState({
    original_resume: '',
    target_job_description: '',
    hiring_manager_linkedin: ''
  });
  
  const [loadingType, setLoadingType] = useState(null); // 'resume' or 'cover'
  const [result, setResult] = useState('');
  const [activeTab, setActiveTab] = useState('resume');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/profile?user_id=${user.id}`);
        if (res.data) {
          setFormData(prev => ({
            ...prev,
            original_resume: res.data.base_resume || '',
            hiring_manager_linkedin: res.data.linkedin_url || ''
          }));
        }
      } catch (err) {
        console.error("Failed to load profile data for resume optimization");
      }
    };
    if (user) fetchProfile();
  }, [user, api]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async (type) => {
    if (!formData.original_resume || !formData.target_job_description) {
      toast.error('Base Resume and Target Job Description are required.');
      return;
    }
    
    setLoadingType(type);
    setResult('');
    setActiveTab(type);
    
    try {
      const endpoint = type === 'resume' ? '/api/resume/optimize' : '/api/resume/cover-letter';
      const res = await api.post(endpoint, formData);
      setResult(type === 'resume' ? res.data.optimized_resume : res.data.cover_letter);
      toast.success(`Successfully generated ${type === 'resume' ? 'Optimized Resume' : 'Cover Letter'}`);
    } catch (err) {
      toast.error('Failed to generate. Please try again.');
      console.error(err);
    } finally {
      setLoadingType(null);
    }
  };

  const downloadTxtFile = () => {
    if (!result) return;
    const filename = activeTab === 'resume' ? 'Optimized_Resume.txt' : 'Cover_Letter.txt';
    fileDownload(result, filename);
    toast.success("Downloaded successfully!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-8rem)] animate-in fade-in duration-500">
      <Toaster position="top-right" />
      
      {/* Input Section */}
      <div className="flex flex-col h-full bg-white border border-border rounded-md shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-surface">
            <h2 className="text-2xl font-bold text-foreground">AI Career Coach</h2>
            <p className="text-muted-foreground text-sm mt-1">Tailor your profile to pass ATS checks and match manager personality.</p>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 flex justify-between">
                <span>Master Resume</span>
                <span className="text-xs text-muted-foreground font-normal">Pre-filled from Profile</span>
            </label>
            <textarea 
              name="original_resume"
              value={formData.original_resume}
              onChange={handleChange}
              className="w-full h-32 bg-white border border-border/60 rounded-md p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-mono"
              placeholder="Paste your base resume text here..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Target Job Description (Required)</label>
            <textarea 
              name="target_job_description"
              value={formData.target_job_description}
              onChange={handleChange}
              className="w-full h-40 bg-white border border-border/60 rounded-md p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
              placeholder="Paste the full job description you are targeting..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5 flex justify-between">
                <span>Hiring Manager LinkedIn (Optional)</span>
                <span className="text-xs text-muted-foreground font-normal">Pre-filled from Profile</span>
            </label>
            <textarea 
              name="hiring_manager_linkedin"
              value={formData.hiring_manager_linkedin}
              onChange={handleChange}
              className="w-full h-20 bg-white border border-border/60 rounded-md p-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              placeholder="Paste LinkedIn About/Posts to adapt the tone to their personality..."
            />
          </div>
        </div>
        
        <div className="p-6 border-t border-border bg-surface flex flex-col gap-3">
            <button 
                onClick={() => handleGenerate('resume')}
                disabled={loadingType !== null}
                className="w-full bg-primary text-white py-3 rounded-md font-medium hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
                {loadingType === 'resume' ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                Optimize Resume for ATS
            </button>
            <button 
                onClick={() => handleGenerate('cover')}
                disabled={loadingType !== null}
                className="w-full bg-white border-2 border-primary text-primary py-3 rounded-md font-medium hover:bg-surface_alt transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
                {loadingType === 'cover' ? <Loader2 className="animate-spin w-5 h-5" /> : <FileText className="w-5 h-5" />}
                Generate Cover Letter
            </button>
        </div>
      </div>
      
      {/* Output Section */}
      <div className="flex flex-col h-full bg-white border border-border rounded-md shadow-sm overflow-hidden">
        <div className="flex border-b border-border bg-surface">
            <button 
                className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'resume' ? 'border-primary text-primary bg-white' : 'border-transparent text-muted-foreground hover:bg-surface_alt'}`}
                onClick={() => setActiveTab('resume')}
            >
                Optimized Resume
            </button>
            <button 
                className={`flex-1 py-4 font-medium text-sm transition-colors border-b-2 ${activeTab === 'cover' ? 'border-primary text-primary bg-white' : 'border-transparent text-muted-foreground hover:bg-surface_alt'}`}
                onClick={() => setActiveTab('cover')}
            >
                Cover Letter
            </button>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto bg-surface_alt/30 font-body relative">
            {loadingType ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-10">
                    <div className="w-16 h-16 relative">
                        <div className="absolute inset-0 border-4 border-border rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 font-medium text-primary animate-pulse">AI Agent is writing...</p>
                </div>
            ) : result ? (
                <div className="whitespace-pre-wrap text-foreground leading-relaxed text-sm font-mono">
                    {result}
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                    <p>Generated content will appear here.</p>
                </div>
            )}
        </div>
        
        <div className="p-4 border-t border-border bg-white flex justify-end gap-3">
            <button 
                onClick={downloadTxtFile}
                disabled={!result}
                className="bg-white border border-border text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-surface_alt transition-colors inline-flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
                <Download className="w-4 h-4" />
                Download .txt
            </button>
            <button 
                disabled={!result}
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-hover transition-colors inline-flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
                <Save className="w-4 h-4" />
                Save to Database
            </button>
        </div>
      </div>

    </div>
  );
}