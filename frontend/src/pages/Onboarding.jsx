import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, ArrowRight, Loader2, Upload } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function Onboarding() {
  const { user, api } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  
  const [profile, setProfile] = useState({
    user_id: user?.id,
    full_name: '',
    base_resume: '',
    linkedin_url: '',
    weekly_goal: 10
  });

  useEffect(() => {
    const checkExistingProfile = async () => {
      try {
        if (!user) return;
        const res = await api.get(`/api/profile?user_id=${user.id}`);
        // If they already filled out their resume (onboarding complete), skip to dashboard
        if (res.data && res.data.base_resume && res.data.base_resume.length > 50) {
            navigate('/dashboard', { replace: true });
        } else {
            setProfile(prev => ({ ...prev, user_id: user.id }));
            setCheckingProfile(false);
        }
      } catch (err) {
        // Doesn't exist, proceed with onboarding
        setProfile(prev => ({ ...prev, user_id: user.id }));
        setCheckingProfile(false);
      }
    };
    checkExistingProfile();
  }, [user, api, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    if (step === 1 && !profile.full_name.trim()) {
        toast.error("Please enter your name to continue.");
        return;
    }
    if (step === 2 && !profile.base_resume.trim()) {
        toast.error("Please paste your resume to continue.");
        return;
    }
    setStep(s => s + 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.put('/api/profile', profile);
      toast.success("Profile setup complete!");
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      toast.error("Failed to save profile. Please try again.");
      setLoading(false);
    }
  };

  if (checkingProfile) {
    return <div className="min-h-screen flex items-center justify-center bg-surface"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 font-body">
      <Toaster position="top-right" />
      
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1.5 bg-surface_alt w-full flex">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        <div className="p-10">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles size={32} />
            </div>
            <h1 className="text-3xl font-bold font-heading text-foreground">
              {step === 1 && "Welcome to AI Job Hunter"}
              {step === 2 && "Let's load your master resume"}
              {step === 3 && "Set your application goals"}
            </h1>
            <p className="text-muted-foreground mt-3 text-lg">
              {step === 1 && "Let's set up your profile so your AI Coach can start working for you immediately."}
              {step === 2 && "We need your base resume to calculate job compatibility scores and generate cover letters."}
              {step === 3 && "Setting a weekly goal keeps you accountable and helps us measure your progress."}
            </p>
          </div>

          <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
            
            {/* STEP 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="w-full bg-surface border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-lg"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">LinkedIn Profile URL (Optional)</label>
                  <input 
                    type="url" 
                    name="linkedin_url"
                    value={profile.linkedin_url}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/janedoe"
                    className="w-full bg-surface border border-border rounded-md px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-2">We use this to analyze your professional tone for cover letters.</p>
                </div>
              </div>
            )}

            {/* STEP 2: Resume */}
            {step === 2 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Paste Base Resume</label>
                <textarea 
                  name="base_resume"
                  value={profile.base_resume}
                  onChange={handleChange}
                  placeholder="Paste your raw text resume here. Don't worry about formatting, the AI only needs the content to match keywords and rewrite."
                  className="w-full h-64 bg-surface border border-border rounded-md p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none text-sm font-mono"
                  autoFocus
                />
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                  <Upload size={16} /> 
                  <span>Document upload coming soon. For now, please copy/paste text.</span>
                </div>
              </div>
            )}

            {/* STEP 3: Goals */}
            {step === 3 && (
              <div className="space-y-8">
                <div>
                  <label className="block text-center font-medium text-foreground mb-6">How many jobs do you want to apply for per week?</label>
                  <div className="flex items-center justify-center gap-6">
                    <button 
                      onClick={() => setProfile(p => ({ ...p, weekly_goal: Math.max(1, p.weekly_goal - 1) }))}
                      className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-surface hover:border-primary transition-colors text-xl font-medium"
                    >
                      -
                    </button>
                    <div className="text-5xl font-bold font-heading w-24 text-center text-primary">
                      {profile.weekly_goal}
                    </div>
                    <button 
                      onClick={() => setProfile(p => ({ ...p, weekly_goal: p.weekly_goal + 1 }))}
                      className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-surface hover:border-primary transition-colors text-xl font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
                    <p className="text-primary font-medium">With the AI Job Hunter, <strong>{profile.weekly_goal} tailored applications</strong> will only take you {profile.weekly_goal * 5} minutes instead of {profile.weekly_goal * 45} minutes.</p>
                </div>
              </div>
            )}

          </div>

          {/* Navigation Buttons */}
          <div className="mt-10 flex items-center justify-between pt-6 border-t border-border/50">
            {step > 1 ? (
              <button 
                onClick={() => setStep(s => s - 1)}
                className="text-muted-foreground font-medium hover:text-foreground transition-colors px-4 py-2"
              >
                Back
              </button>
            ) : <div></div>}

            {step < 3 ? (
              <button 
                onClick={handleNext}
                className="bg-primary text-white font-medium px-8 py-3 rounded-md hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm"
              >
                Continue <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                disabled={loading}
                className="bg-accent-success text-white font-medium px-8 py-3 rounded-md hover:bg-accent-success/90 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Go to Dashboard"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}