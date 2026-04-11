import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Briefcase, FileText, Video, Mail, LayoutDashboard, BrainCircuit } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    localStorage.removeItem('local_session');
    navigate('/');
  };

  const navItems = [
    { name: 'Job Feed', path: '/dashboard', icon: Briefcase },
    { name: 'Tracker', path: '/tracker', icon: LayoutDashboard },
    { name: 'Insights', path: '/insights', icon: BrainCircuit },
    { name: 'Resumes', path: '/resume', icon: FileText },
    { name: 'Cover Letters', path: '/cover-letter', icon: Mail },
    { name: 'Interview Practice', path: '/interview', icon: Video },
  ];

  return (
    <div className="sidebar glass-panel" style={{ borderRadius: 0, borderTop: 0, borderBottom: 0, borderLeft: 0, position: 'relative' }}>
      <h2 style={{ 
        marginBottom: '2rem', 
        background: 'linear-gradient(to right, #818cf8, #c084fc)', 
        WebkitBackgroundClip: 'text', 
        WebkitTextFillColor: 'transparent', 
        fontWeight: 'bold',
        cursor: 'pointer'
      }} onClick={() => navigate('/dashboard')}>
        Opportunity Builder
      </h2>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className="btn-primary" 
              style={{ 
                background: isActive ? 'var(--accent)' : 'transparent', 
                boxShadow: isActive ? '0 4px 14px 0 var(--accent-glow)' : 'none', 
                textAlign: 'left', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                color: isActive ? 'white' : 'var(--text-muted)',
                padding: '0.75rem 1rem'
              }}
            >
              <Icon size={18} /> {item.name}
            </button>
          );
        })}
      </nav>

      <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem' }}>
        <button 
          onClick={handleLogout} 
          className="btn-primary" 
          style={{ 
            width: '100%',
            background: 'rgba(239, 68, 68, 0.2)', 
            color: '#fca5a5', 
            boxShadow: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem' 
          }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}
