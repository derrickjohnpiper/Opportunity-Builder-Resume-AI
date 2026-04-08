import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, FileText, Video, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { api, user } = useAuth();
  const [stats, setStats] = useState({ jobs: 0, applied: 0, interviews: 0 });
  const [profile, setProfile] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, appsRes, profileRes] = await Promise.all([
          api.get(`/api/jobs?user_id=${user.id}`),
          api.get(`/api/applications?user_id=${user.id}`),
          api.get(`/api/profile?user_id=${user.id}`)
        ]);
        
        const jobsCount = jobsRes.data.length;
        const appsCount = appsRes.data.length;
        const interviewsCount = appsRes.data.filter(a => a.status === 'Interviewing').length;
        
        setStats({ jobs: jobsCount, applied: appsCount, interviews: interviewsCount });
        setProfile(profileRes.data);

        // Build mock chart data based on actual applied numbers
        setChartData([
            { name: 'Mon', applications: Math.floor(appsCount * 0.1) },
            { name: 'Tue', applications: Math.floor(appsCount * 0.2) },
            { name: 'Wed', applications: Math.floor(appsCount * 0.15) },
            { name: 'Thu', applications: Math.floor(appsCount * 0.3) },
            { name: 'Fri', applications: Math.floor(appsCount * 0.25) },
            { name: 'Sat', applications: 0 },
            { name: 'Sun', applications: 0 },
        ]);

      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchData();
  }, [user, api]);

  const weeklyGoal = profile?.weekly_goal || 10;
  const progressPercent = Math.min(100, Math.round((stats.applied / weeklyGoal) * 100)) || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-none mb-2">Control Room</h1>
        <p className="text-lg text-muted-foreground">Welcome back, {profile?.full_name ? profile.full_name.split(' ')[0] : 'Job Hunter'}. Here is your overview.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Jobs Aggregated" value={stats.jobs} icon={<Briefcase />} color="bg-primary/10 text-primary" />
        <StatCard title="Applications Sent" value={stats.applied} icon={<FileText />} color="bg-accent-warm/10 text-accent-warm" />
        <StatCard title="Mock Interviews" value={1} icon={<Video />} color="bg-accent-warning/10 text-accent-warning" />
        <StatCard title="Active Interviews" value={stats.interviews} icon={<Trophy />} color="bg-accent-success/10 text-accent-success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Weekly Progress & Chart */}
        <div className="lg:col-span-2 bg-white border border-border rounded-md p-6 shadow-sm flex flex-col">
            <h3 className="text-xl font-bold mb-1 text-foreground">Weekly Progress</h3>
            <p className="text-sm text-muted-foreground mb-6">{stats.applied} of {weeklyGoal} applications sent this week.</p>
            
            <div className="w-full bg-surface h-3 rounded-full overflow-hidden mb-8 border border-border/50">
                <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
            </div>

            <div className="flex-1 h-64 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#4B5563', fontSize: 12}} dx={-10} allowDecimals={false} />
                        <Tooltip 
                            cursor={{fill: '#F3F4F6'}} 
                            contentStyle={{borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} 
                        />
                        <Bar dataKey="applications" fill="#1D3557" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Upgrade & Actions */}
        <div className="space-y-8 flex flex-col justify-between h-full">
            <div className="bg-white border border-border rounded-md p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-4 text-foreground">Next Actions</h3>
            <div className="space-y-3">
                <ActionItem 
                title="Review New Jobs" 
                desc="New jobs aggregated." 
                link="/jobs" 
                btnText="Review" 
                />
                <ActionItem 
                title="Optimize Resume" 
                desc="Tailor your master resume." 
                link="/resume" 
                btnText="Optimize" 
                />
                <ActionItem 
                title="Mock Interview Practice" 
                desc="Schedule an AI mock interview." 
                link="/interview" 
                btnText="Practice" 
                />
            </div>
            </div>

            <div className="bg-white border border-border rounded-md p-6 shadow-sm flex items-center justify-center relative overflow-hidden group flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0"></div>
                <div className="z-10 text-center p-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                        <Trophy size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
                    <p className="text-sm text-muted-foreground mb-6">Unlimited AI optimization & real-time mock interviews.</p>
                    <button onClick={async () => {
                    try {
                        const originUrl = window.location.origin;
                        const res = await api.post(`/api/checkout/session`, { packageId: 'pro', originUrl, user_id: user.id });
                        window.location.href = res.data.url;
                    } catch (e) {
                        toast.error("Failed to checkout");
                    }
                    }} className="bg-primary text-white px-6 py-2 rounded-md font-medium text-sm hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 inline-block w-full">
                        Upgrade Now - $19.99
                    </button>
                </div>
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
  <div className="flex items-center justify-between p-3 bg-surface rounded-md border border-border/50">
    <div>
      <h4 className="font-medium text-sm text-foreground">{title}</h4>
    </div>
    <Link to={link} className="text-xs font-medium bg-white border border-border px-3 py-1.5 rounded-md hover:bg-surface_alt transition-colors whitespace-nowrap ml-4 shadow-sm">
      {btnText}
    </Link>
  </div>
);