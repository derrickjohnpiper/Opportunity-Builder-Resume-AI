import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Toaster, toast } from 'sonner';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS = ['Applied', 'Interviewing', 'Offer', 'Rejected'];

export default function Kanban() {
  const { api, user } = useAuth();
  const [apps, setApps] = useState([]);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await api.get(`/api/applications?user_id=${user.id}`);
        setApps(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (user) fetchApps();
  }, [user, api]);

  const moveCard = async (appId, newStatus) => {
    try {
      await api.put(`/api/applications/${appId}/status`, { status: newStatus });
      setApps(prev => prev.map(app => app.id === appId ? { ...app, status: newStatus } : app));
      toast.success(`Moved to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to move');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId !== overId) {
        // Find which column we dragged it over
        const newStatus = COLUMNS.includes(overId) ? overId : apps.find(a => a.id === overId)?.status;
        
        if (newStatus && newStatus !== apps.find(a => a.id === activeId)?.status) {
            moveCard(activeId, newStatus);
        }
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <Toaster position="top-right" />
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">App Tracker</h1>
        <p className="text-muted-foreground mt-1">Kanban board for approved applications. Drag and drop to update statuses.</p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn key={col} title={col} items={apps.filter(a => a.status === col)} />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function KanbanColumn({ title, items }) {
  return (
    <div className="bg-surface/50 border border-border rounded-md flex flex-col min-w-[280px]">
      <div className="p-4 border-b border-border bg-surface font-bold text-foreground flex justify-between items-center">
          {title}
          <span className="bg-white px-2.5 py-0.5 rounded-full text-xs font-bold border border-border/50 text-muted-foreground">
              {items.length}
          </span>
      </div>
      
      <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
        <SortableContext id={title} items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(app => (
            <SortableCard key={app.id} app={app} />
          ))}
          {/* Invisible droppable area at the bottom of empty columns */}
          {items.length === 0 && (
              <div id={title} className="h-24 border-2 border-dashed border-border/50 rounded-md flex items-center justify-center text-sm text-muted-foreground">
                  Drop here
              </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function SortableCard({ app }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        {...listeners}
        className="bg-white border border-border p-4 rounded-md shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
    >
      <h4 className="font-bold text-foreground line-clamp-1">{app.title}</h4>
      <p className="text-sm text-primary mb-2 font-medium line-clamp-1">{app.company}</p>
      <div className="text-[10px] text-muted-foreground mt-3 flex justify-between items-center">
        <span>Added {new Date(app.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}