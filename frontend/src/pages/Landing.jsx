import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Video, Briefcase, LayoutDashboard } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground selection:bg-primary selection:text-white">
      {/* Navigation */}
      <nav className="border-b border-border/50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold font-heading text-lg">
              J
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-foreground">AI Job Hunter</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Log in
            </Link>
            <Link to="/dashboard" className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-md hover:bg-primary-hover transition-transform hover:-translate-y-0.5 shadow-sm shadow-primary/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-32 px-6 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3137073/pexels-photo-3137073.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')] bg-cover bg-center opacity-[0.03] z-0"></div>
        <div className="max-w-[1200px] mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-warm/10 text-accent-warm text-sm font-bold tracking-wide mb-8 border border-accent-warm/20">
            <Sparkles size={14} />
            <span>POWERED BY GEMMA 2B & OLLAMA</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold font-heading text-foreground tracking-tight max-w-4xl mx-auto leading-[1.1] mb-6">
            The unfair advantage for your <span className="text-primary">career growth.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Automate job hunting, tailor your resume to pass ATS filters, and ace interviews with your personal AI Career Coach. 
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/dashboard" className="w-full sm:w-auto bg-primary text-white font-medium text-lg px-8 py-4 rounded-md hover:bg-primary-hover transition-all hover:shadow-xl hover:shadow-primary/20 hover:-translate-y-1 flex items-center justify-center gap-2">
              Start Hunting Free
              <ArrowRight size={20} />
            </Link>
            <a href="#demo" className="w-full sm:w-auto bg-white border border-border text-foreground font-medium text-lg px-8 py-4 rounded-md hover:bg-surface_alt transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
              <Video size={20} className="text-muted-foreground" />
              Watch Demo
            </a>
          </div>
        </div>

        {/* Mockup Preview */}
        <div className="max-w-[1000px] mx-auto mt-20 relative z-10">
          <div className="aspect-[16/9] bg-white rounded-xl shadow-2xl border border-border/50 overflow-hidden flex flex-col">
            <div className="h-12 border-b border-border/50 bg-surface flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                <div className="w-3 h-3 rounded-full bg-accent-warning"></div>
                <div className="w-3 h-3 rounded-full bg-accent-success"></div>
              </div>
            </div>
            <div className="flex-1 bg-surface_alt p-8 relative">
                {/* Abstract UI Representation */}
                <div className="w-full h-full bg-white rounded border border-border shadow-sm flex">
                    <div className="w-48 border-r border-border/50 p-4 space-y-3">
                        <div className="h-6 bg-surface rounded w-3/4"></div>
                        <div className="h-6 bg-surface rounded w-full"></div>
                        <div className="h-6 bg-primary/10 rounded w-5/6"></div>
                        <div className="h-6 bg-surface rounded w-2/3"></div>
                    </div>
                    <div className="flex-1 p-6 space-y-6">
                        <div className="h-8 bg-surface rounded w-1/3 mb-8"></div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="h-24 bg-surface rounded border border-border/50"></div>
                            <div className="h-24 bg-surface rounded border border-border/50"></div>
                            <div className="h-24 bg-surface rounded border border-border/50"></div>
                        </div>
                        <div className="h-48 bg-surface rounded border border-border/50 mt-4"></div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-surface px-6 border-y border-border/50">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-heading text-foreground mb-4">Everything you need to land the job</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">From discovering opportunities to signing the offer letter, your AI coach is there every step of the way.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Briefcase className="text-primary" size={28} />}
              title="Smart Job Aggregation"
              description="Automatically pulls jobs from top boards and scores them against your resume for compatibility."
            />
            <FeatureCard 
              icon={<Sparkles className="text-accent-warm" size={28} />}
              title="ATS-Optimized Resumes"
              description="Instantly tailors your resume and cover letter to perfectly match the target job description."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="text-accent-success" size={28} />}
              title="Kanban App Tracker"
              description="Visual pipeline to track applications, interviews, and follow-ups all in one place."
            />
            <FeatureCard 
              icon={<Video className="text-primary" size={28} />}
              title="AI Mock Interviews"
              description="Practice with a video AI agent that asks contextual questions and gives real-time feedback."
            />
            <FeatureCard 
              icon={<CheckCircle2 className="text-accent-warning" size={28} />}
              title="Hiring Manager Profiling"
              description="Adapts the tone of your cover letter based on the hiring manager's LinkedIn personality."
            />
            <FeatureCard 
              icon={<LayoutDashboard className="text-primary" size={28} />}
              title="Local Privacy First"
              description="Run the Gemma 2B model completely locally. Your data and resume never leave your machine."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-[800px] mx-auto text-center bg-primary rounded-2xl p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.pexels.com/photos/3137073/pexels-photo-3137073.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940')] bg-cover opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-6">Ready to upgrade your career?</h2>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
              Join thousands of job seekers who are getting more interviews and landing better offers with AI Job Hunter.
            </p>
            <Link to="/dashboard" className="inline-block bg-white text-primary font-bold text-lg px-10 py-4 rounded-md hover:bg-surface transition-all hover:scale-105 shadow-xl">
              Get Started for Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-border/50 py-12 px-6">
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white font-bold font-heading text-sm">
              J
            </div>
            <span className="font-heading font-bold text-foreground">AI Job Hunter</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 AI Job Hunter. Built on open source.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms</a>
            <a href="#" className="hover:text-primary transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="bg-white p-8 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="w-14 h-14 bg-surface rounded-lg flex items-center justify-center mb-6 border border-border/50">
        {icon}
      </div>
      <h3 className="text-xl font-bold font-heading text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}