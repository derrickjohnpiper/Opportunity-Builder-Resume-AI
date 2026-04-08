import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader2, Save, User } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function Profile() {
  const { user, api } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/api/profile?user_id=${user.id}`);
        setProfile(res.data);
      } catch (err) {
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchProfile();
  }, [user, api]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/profile', profile);
      toast.success("Profile saved successfully.");
    } catch (err) {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <Toaster position="top-right" />
      
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account, resume, and application goals.</p>
      </div>

      <div className="bg-white border border-border rounded-md shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border bg-surface flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <User size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{profile?.full_name || 'Guest User'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
              <input 
                type="text" 
                name="full_name"
                value={profile?.full_name || ''}
                onChange={handleChange}
                className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">LinkedIn Profile URL</label>
              <input 
                type="url" 
                name="linkedin_url"
                value={profile?.linkedin_url || ''}
                onChange={handleChange}
                className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Weekly Application Goal</label>
              <input 
                type="number" 
                name="weekly_goal"
                value={profile?.weekly_goal || 10}
                onChange={handleChange}
                min="1"
                className="w-full bg-surface border border-border rounded-md px-4 py-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          <hr className="border-border/50" />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Master Resume</label>
            <p className="text-xs text-muted-foreground mb-3">This resume is used automatically for Job Aggregator compatibility scoring and Cover Letter generation.</p>
            <textarea 
              name="base_resume"
              value={profile?.base_resume || ''}
              onChange={handleChange}
              className="w-full h-64 bg-surface border border-border rounded-md p-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-mono text-sm"
            />
          </div>

        </div>

        <div className="p-6 border-t border-border bg-surface flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-white font-medium px-6 py-2 rounded-md hover:bg-primary-hover transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}