import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, Facebook, Github, Twitter, Instagram, LayoutDashboard, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const { signInWithOAuth, user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isSigningIn, setIsSigningIn] = useState(null);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  if (user) return <Navigate to="/dashboard" />;

  const handleOAuthSignIn = async (provider) => {
    try {
      setError(null);
      setIsSigningIn(provider);
      await signInWithOAuth(provider);
    } catch (err) {
      setError(`Failed to sign in with ${provider}: ${err.message}`);
      setIsSigningIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 font-body">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-border/50 p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold font-heading text-2xl mb-4">
            J
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground text-center">Sign in to AI Job Hunter</h1>
          <p className="text-muted-foreground text-sm text-center mt-2">Access your AI career coach, track applications, and optimize your resume.</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-md p-3 mb-6 text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <AuthButton 
            provider="google" 
            icon={<Mail className="w-5 h-5 text-red-500" />} 
            label="Continue with Google"
            onClick={handleOAuthSignIn}
            loading={isSigningIn === 'google'}
          />
          <AuthButton 
            provider="github" 
            icon={<Github className="w-5 h-5" />} 
            label="Continue with GitHub"
            onClick={handleOAuthSignIn}
            loading={isSigningIn === 'github'}
          />
          <AuthButton 
            provider="azure" 
            icon={<LayoutDashboard className="w-5 h-5 text-blue-500" />} 
            label="Continue with Outlook / Microsoft"
            onClick={handleOAuthSignIn}
            loading={isSigningIn === 'azure'}
          />
          <AuthButton 
            provider="facebook" 
            icon={<Facebook className="w-5 h-5 text-blue-600" />} 
            label="Continue with Facebook"
            onClick={handleOAuthSignIn}
            loading={isSigningIn === 'facebook'}
          />
          <AuthButton 
            provider="twitter" 
            icon={<Twitter className="w-5 h-5 text-sky-500" />} 
            label="Continue with Twitter"
            onClick={handleOAuthSignIn}
            loading={isSigningIn === 'twitter'}
          />
          <AuthButton 
            provider="notion" 
            icon={<Instagram className="w-5 h-5 text-pink-600" />} 
            label="Continue with Instagram"
            onClick={() => handleOAuthSignIn('notion')} // using notion as a placeholder or standard custom provider setup
            loading={isSigningIn === 'notion'}
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy. <br/>
            You will need to enable these providers in your Supabase Dashboard later.
          </p>
        </div>

      </div>
    </div>
  );
};

function AuthButton({ icon, label, onClick, provider, loading }) {
  return (
    <button 
      onClick={() => onClick(provider)}
      disabled={loading}
      className="w-full bg-white border border-border/60 hover:bg-surface_alt text-foreground font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-sm disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      {label}
    </button>
  );
}