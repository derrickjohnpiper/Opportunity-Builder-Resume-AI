import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const COLUMNS = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];
import API_BASE_URL from '../apiConfig';

import { forwardRef } from 'react';

const JobCard = forwardRef(({ job, style, attributes, listeners, isDragging }, ref) => {
  return (
    <div
      ref={ref}
      style={style}
      {...attributes}
      {...listeners}
      className={`glass-card ${isDragging ? 'glass-card-dragging' : ''}`}
    >
      <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{job.title}</h4>
      <p style={{ fontSize: '0.875rem', color: 'var(--accent)' }}>{job.company}</p>
      {job.notes && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{job.notes}</p>}
    </div>
  );
});

const SortableJobCard = ({ job }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: job.id, data: { status: job.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <JobCard 
      ref={setNodeRef}
      style={style}
      attributes={attributes}
      listeners={listeners}
      isDragging={isDragging}
      job={job}
    />
  );
};

const DroppableColumn = ({ id, items }) => {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        {id}
        <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>{items.length}</span>
      </div>
      <div ref={setNodeRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '200px' }}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(job => (
            <SortableJobCard key={job.id} job={job} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default function KanbanBoard({ initialJobs, userId, onJobMove }) {
  const [jobs, setJobs] = useState(initialJobs || []);
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    setJobs(initialJobs || []);
  }, [initialJobs]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeJob = jobs.find(j => j.id === active.id);
    const overId = over.id;
    
    // Check if dropping into another column area
    let newStatus = activeJob.status || 'Saved';
    if (COLUMNS.includes(overId)) {
      newStatus = overId;
    } else {
      // Dropping onto an item within a column
      const overJob = jobs.find(j => j.id === overId);
      if (overJob) {
        newStatus = overJob.status || 'Saved';
      }
    }

    if (activeJob.status !== newStatus) {
      // Update local state optimistic
      const newJobs = jobs.map(j => {
        if (j.id === active.id) return { ...j, status: newStatus };
        return j;
      });
      setJobs(newJobs);

      // Async remote update
      try {
        const response = await fetch(`${API_BASE_URL}/applications/${active.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (!response.ok) throw new Error("API failure");
        
        if (onJobMove) onJobMove();
      } catch (e) {
        console.error("Failed to move job", e);
        // Rollback on fail
        setJobs(jobs);
      }
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {COLUMNS.map(col => (
          <DroppableColumn key={col} id={col} items={jobs.filter(j => (j.status || 'Saved') === col)} />
        ))}
      </div>
      <DragOverlay>
        {activeId ? <JobCard job={jobs.find(j => j.id === activeId)} isDragging={true} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
