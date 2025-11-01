import { Job } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MoreVertical, GripVertical, Archive, ArchiveRestore, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  onEdit: (job: Job) => void;
  onArchive: (job: Job) => void;
}

export function JobCard({ job, onEdit, onArchive }: JobCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative overflow-hidden border-border bg-card p-4 transition-shadow hover:shadow-md',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-start gap-3">
        <button
          className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground text-lg">{job.title}</h3>
              <p className="text-sm text-muted-foreground">{job.location}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(job)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive(job)}>
                  {job.status === 'archived' ? (
                    <>
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Unarchive
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
              {job.status}
            </Badge>
            {job.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>

          {job.description && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
              {job.description}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
