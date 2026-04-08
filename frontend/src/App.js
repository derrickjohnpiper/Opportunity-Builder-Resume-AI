import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Briefcase, FileText, Video, Trello } from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Kanban from "./pages/Kanban";
import Resume from "./pages/Resume";
import Interview from "./pages/Interview";

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={20} /> },
    { name: "Jobs Aggregator", path: "/jobs", icon: <Briefcase size={20} /> },
    { name: "App Tracker", path: "/kanban", icon: <Trello size={20} /> },
    { name: "Resume & Cover", path: "/resume", icon: <FileText size={20} /> },
    { name: "Mock Interview", path: "/interview", icon: <Video size={20} /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-border h-screen sticky top-0 flex flex-col p-4 shadow-sm">
      <div className="flex items-center gap-3 px-4 py-6 mb-4 border-b border-border/50">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xl">
          J
        </div>
        <h1 className="text-xl font-heading font-bold text-foreground">AI Job Hunter</h1>
      </div>
      
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              data-testid={`nav-link-${item.name.toLowerCase().replace(/ /g, "-")}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 ${
                isActive 
                  ? "bg-primary text-white font-medium shadow-md shadow-primary/10" 
                  : "text-muted-foreground hover:bg-surface hover:text-foreground"
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto p-4 bg-surface rounded-md border border-border/50">
        <div className="flex items-center gap-3">
          <img 
            src="https://images.unsplash.com/photo-1576558656222-ba66febe3dec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMHBvcnRyYWl0fGVufDB8fHx8MTc3NTY0NTM5N3ww&ixlib=rb-4.1.0&q=85" 
            alt="Profile" 
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div>
            <p className="text-sm font-medium text-foreground">Hiring Pro</p>
            <p className="text-xs text-muted-foreground">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-surface_alt font-body">
      <Sidebar />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="p-6 md:p-8 lg:p-12 max-w-[1600px] w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/resume" element={<Resume />} />
          <Route path="/interview" element={<Interview />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;