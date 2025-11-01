import { useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, Phone } from 'lucide-react';
import { useState } from 'react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stage: string;
  jobId: string;
}

interface CandidateKanbanProps {
  candidates: Candidate[];
  onStageChange: (candidateId: string, newStage: string) => void;
}

const stages = [
  { id: 'applied', label: 'Applied', color: 'bg-blue-500' },
  { id: 'screen', label: 'Screening', color: 'bg-yellow-500' },
  { id: 'tech', label: 'Technical', color: 'bg-purple-500' },
  { id: 'offer', label: 'Offer', color: 'bg-green-500' },
  { id: 'hired', label: 'Hired', color: 'bg-emerald-500' },
  { id: 'rejected', label: 'Rejected', color: 'bg-red-500' },
];

function CandidateCard({ candidate }: { candidate: Candidate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: candidate.id,
    data: { candidate },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="font-medium text-sm">{candidate.name}</div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
        <Mail className="h-3 w-3" />
        <span className="truncate">{candidate.email}</span>
      </div>
      {candidate.phone && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <Phone className="h-3 w-3" />
          <span>{candidate.phone}</span>
        </div>
      )}
    </Card>
  );
}

export function CandidateKanban({ candidates, onStageChange }: CandidateKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const candidatesByStage = useMemo(() => {
    const grouped: Record<string, Candidate[]> = {};
    stages.forEach(stage => {
      grouped[stage.id] = candidates.filter(c => c.stage === stage.id);
    });
    return grouped;
  }, [candidates]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const candidateId = active.id as string;
    const candidate = active.data.current?.candidate;
    const newStage = over.data.current?.stage || over.id;

    if (candidate && candidate.stage !== newStage) {
      onStageChange(candidateId, newStage as string);
    }
  };

  const activeCandidate = activeId ? candidates.find(c => c.id === activeId) : null;

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-6 gap-4">
        {stages.map((stage) => (
          <SortableContext
            key={stage.id}
            id={stage.id}
            items={candidatesByStage[stage.id]?.map(c => c.id) || []}
            strategy={verticalListSortingStrategy}
          >
            <div
              data-stage={stage.id}
              className="bg-muted/30 rounded-lg p-3 min-h-[500px]"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <Badge variant="secondary" className="ml-auto">{candidatesByStage[stage.id]?.length || 0}</Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-300px)]">
                <div data-stage={stage.id} className="space-y-2">
                  {candidatesByStage[stage.id]?.map((candidate) => (
                    <CandidateCard key={candidate.id} candidate={candidate} />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </SortableContext>
        ))}
      </div>
      <DragOverlay>
        {activeCandidate && (
          <Card className="p-3 shadow-lg rotate-3">
            <div className="font-medium text-sm">{activeCandidate.name}</div>
            <div className="text-xs text-muted-foreground mt-1">{activeCandidate.email}</div>
          </Card>
        )}
      </DragOverlay>
    </DndContext>
  );
}
