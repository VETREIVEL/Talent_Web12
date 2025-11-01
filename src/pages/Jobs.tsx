import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Layout } from '@/components/Layout';
import { JobCard } from '@/components/jobs/JobCard';
import { JobFormDialog } from '@/components/jobs/JobFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search } from 'lucide-react';
import { Job } from '@/lib/db';
import { toast } from 'sonner';

export default function Jobs() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', { search, status: status === 'all' ? '' : status, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        search,
        status: status === 'all' ? '' : status,
        page: page.toString(),
        pageSize: '20',
        sort: 'order',
      });
      
      const response = await fetch(`/api/jobs?${params}`);
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (jobData: any) => {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...jobData,
          status: 'active',
          order: (data?.data?.length || 0) + 1,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job created successfully');
    },
    onError: () => {
      toast.error('Failed to create job');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast.success('Job updated successfully');
    },
    onError: () => {
      toast.error('Failed to update job');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, fromOrder, toOrder }: { id: string; fromOrder: number; toOrder: number }) => {
      const response = await fetch(`/api/jobs/${id}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromOrder, toOrder }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reorder');
      }
      
      return response.json();
    },
    onMutate: async ({ id, fromOrder, toOrder }) => {
      await queryClient.cancelQueries({ queryKey: ['jobs'] });
      
      const previousData = queryClient.getQueryData(['jobs', { search, status: status === 'all' ? '' : status, page }]);
      
      queryClient.setQueryData(
        ['jobs', { search, status: status === 'all' ? '' : status, page }],
        (old: any) => {
          if (!old?.data) return old;
          
          const jobs = [...old.data];
          const jobIndex = jobs.findIndex(j => j.id === id);
          const [movedJob] = jobs.splice(jobIndex, 1);
          
          const newIndex = jobs.findIndex(j => j.order === toOrder);
          jobs.splice(newIndex, 0, movedJob);
          
          return { ...old, data: jobs };
        }
      );
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ['jobs', { search, status: status === 'all' ? '' : status, page }],
          context.previousData
        );
      }
      toast.error('Failed to reorder jobs');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const jobs = data?.data || [];
      const oldIndex = jobs.findIndex((j: Job) => j.id === active.id);
      const newIndex = jobs.findIndex((j: Job) => j.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderMutation.mutate({
          id: active.id as string,
          fromOrder: jobs[oldIndex].order,
          toOrder: jobs[newIndex].order,
        });
      }
    }
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setDialogOpen(true);
  };

  const handleArchive = (job: Job) => {
    updateMutation.mutate({
      id: job.id,
      data: { status: job.status === 'archived' ? 'active' : 'archived' },
    });
  };

  const handleSubmit = async (formData: any) => {
    if (editingJob) {
      await updateMutation.mutateAsync({
        id: editingJob.id,
        data: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
    setEditingJob(null);
  };

  const jobs = data?.data || [];
  const activeJob = jobs.find((j: Job) => j.id === activeId);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
            <p className="text-muted-foreground mt-1">Manage your job postings</p>
          </div>
          <Button onClick={() => { setEditingJob(null); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            New Job
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search jobs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No jobs found</div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={jobs.map((j: Job) => j.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {jobs.map((job: Job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onEdit={handleEdit}
                    onArchive={handleArchive}
                  />
                ))}
              </div>
            </SortableContext>
            
            <DragOverlay>
              {activeJob && (
                <div className="opacity-90">
                  <JobCard
                    job={activeJob}
                    onEdit={handleEdit}
                    onArchive={handleArchive}
                  />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page} of {data.totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      <JobFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        job={editingJob}
        onSubmit={handleSubmit}
      />
    </Layout>
  );
}
