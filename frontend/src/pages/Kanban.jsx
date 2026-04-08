import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const COLUMNS = ['Applied', 'Interviewing', 'Offer', 'Rejected'];

export default function Kanban() {
  const [apps, setApps] = useState([]);

  const fetchApps = async () => {
    try {
      const res = await axios.get(`${API}/applications`);
      setApps(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const moveCard = async (appId, newStatus) => {
    try {
      await axios.put(`${API}/applications/${appId}/status`, { status: newStatus });
      fetchApps();
      toast.success(`Moved to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to move');
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <Toaster position="top-right" />
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">App Tracker</h1>
        <p className="text-muted-foreground mt-1">Kanban board for approved applications.</p>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div key={col} className="bg-surface/50 border border-border rounded-md flex flex-col min-w-[280px]">
            <div className="p-4 border-b border-border bg-surface font-semibold text-foreground flex justify-between items-center">
                {col}
                <span className="bg-white px-2 py-0.5 rounded-full text-xs border border-border">
                    {apps.filter(a => a.status === col).length}
                </span>
            </div>
            <div className="p-4 flex-1 space-y-4 overflow-y-auto">
              {apps.filter(a => a.status === col).map(app => (
                <div key={app.id} className="bg-white border border-border p-4 rounded-md shadow-sm hover:-translate-y-1 transition-transform duration-200 hover:shadow-md hover:border-primary/30">
                  <h4 className="font-bold text-foreground">{app.title}</h4>
                  <p className="text-sm text-primary mb-3">{app.company}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {COLUMNS.map(target => {
                      if (target === col) return null;
                      return (
                        <button 
                          key={target}
                          onClick={() => moveCard(app.id, target)}
                          className="text-xs bg-surface hover:bg-border text-muted-foreground px-2 py-1 rounded transition-colors"
                        >
                          → {target}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}