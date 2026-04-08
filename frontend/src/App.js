import { useState } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, Briefcase, FileText, Video, Trello, LogOut } from "lucide-react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Kanban from "./pages/Kanban";
import Resume from "./pages/Resume";
import Interview from "./pages/Interview";
import Landing from "./pages/Landing";
import { LoginPage } from "./pages/LoginPage";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Jobs Aggregator", path: "/jobs", icon: <Briefcase size={20} /> },
    { name: "App Tracker", path: "/kanban", icon: <Trello size={20} /> },
    { name: "Resume & Cover", path: "/resume", icon: <FileText size={20} /> },
    { name: "Mock Interview", path: "/interview", icon: <Video size={20} /> },
  ];

  return (
    <div className="w-64 bg-white border-r border-border h-screen sticky top-0 flex flex-col p-4 shadow-sm">
      <Link to="/" className="flex items-center gap-3 px-4 py-6 mb-4 border-b border-border/50 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xl">
          J
        </div>
        <h1 className="text-xl font-heading font-bold text-foreground">AI Job Hunter</h1>
      </Link>
      
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
      
      <div className="mt-auto pt-4 border-t border-border/50">
        <div className="p-4 bg-surface rounded-md border border-border/50 mb-3 flex flex-col gap-2">
          <p className="text-xs text-muted-foreground truncate">{user?.email || "Guest"}</p>
          <button onClick={signOut} className="flex items-center gap-2 text-xs font-medium text-destructive hover:opacity-80">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

const AppLayout = ({ children }) => {
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute><AppLayout><Jobs /></AppLayout></ProtectedRoute>} />
      <Route path="/kanban" element={<ProtectedRoute><AppLayout><Kanban /></AppLayout></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><AppLayout><Resume /></AppLayout></ProtectedRoute>} />
      <Route path="/interview" element={<ProtectedRoute><AppLayout><Interview /></AppLayout></ProtectedRoute>} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;