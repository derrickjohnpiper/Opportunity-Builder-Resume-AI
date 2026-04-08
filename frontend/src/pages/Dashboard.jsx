import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, FileText, Video, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ jobs: 0, applied: 0, interviews: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, appsRes] = await Promise.all([
          axios.get(`${API}/jobs`),
          axios.get(`${API}/applications`)
        ]);
        
        const jobsCount = jobsRes.data.length;
        const appsCount = appsRes.data.length;
        const interviewsCount = appsRes.data.filter(a => a.status === 'Interviewing').length;
        
        setStats({ jobs: jobsCount, applied: appsCount, interviews: interviewsCount });
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-none mb-2">Control Room</h1>
        <p className="text-lg text-muted-foreground">Welcome back. Here is your job hunting overview for today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <StatCard title="Total Jobs Scraped" value={stats.jobs} icon={<Briefcase />} color="bg-primary/10 text-primary" />
        <StatCard title="Applications Sent" value={stats.applied} icon={<FileText />} color="bg-accent-warm/10 text-accent-warm" />
        <StatCard title="Mock Interviews Done" value={1} icon={<Video />} color="bg-accent-warning/10 text-accent-warning" />
        <StatCard title="Active Interviews" value={stats.interviews} icon={<Trophy />} color="bg-accent-success/10 text-accent-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-border rounded-md p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Next Actions</h3>
          <div className="space-y-4">
            <ActionItem 
              title="Review New Jobs" 
              desc="3 new jobs aggregated from DoubleList & LinkedIn" 
              link="/jobs" 
              btnText="Review" 
            />
            <ActionItem 
              title="Optimize Resume" 
              desc="Pending resume tailoring for 'Senior Engineer' at TechCorp" 
              link="/resume" 
              btnText="Optimize" 
            />
            <ActionItem 
              title="Mock Interview Practice" 
              desc="Schedule an AI mock interview to practice behavioral questions" 
              link="/interview" 
              btnText="Practice" 
            />
          </div>
        </div>
        
        <div className="bg-white border border-border rounded-md p-6 shadow-sm flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0"></div>
            <div className="z-10 text-center p-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                    <Trophy size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">AI Career Coach</h3>
                <p className="text-muted-foreground mb-6">Your personal agent is ready to optimize your next application.</p>
                <Link to="/resume" className="bg-primary text-white px-6 py-2 rounded-md font-medium hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 inline-block">
                    Start Optimization
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white border border-border rounded-md p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
    <div className="flex items-center gap-4">
      <div className={`p-4 rounded-md ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h4 className="text-3xl font-bold text-foreground mt-1">{value}</h4>
      </div>
    </div>
  </div>
);

const ActionItem = ({ title, desc, link, btnText }) => (
  <div className="flex items-center justify-between p-4 bg-surface rounded-md border border-border/50">
    <div>
      <h4 className="font-medium text-foreground">{title}</h4>
      <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
    </div>
    <Link to={link} className="text-sm font-medium bg-white border border-border px-4 py-2 rounded-md hover:bg-surface_alt transition-colors whitespace-nowrap ml-4 shadow-sm">
      {btnText}
    </Link>
  </div>
);