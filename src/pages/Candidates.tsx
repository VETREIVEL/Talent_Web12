import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CandidateFormDialog } from '@/components/candidates/CandidateFormDialog';
import { CandidateKanban } from '@/components/candidates/CandidateKanban';
import { useToast } from '@/hooks/use-toast';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const stageLabels: Record<string, string> = {
  applied: 'Applied',
  screen: 'Screening',
  tech: 'Technical',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

export default function Candidates() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ['candidates', search],
    queryFn: async () => {
      const res = await fetch(`/api/candidates?search=${search}&pageSize=2000`);
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create candidate');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      setDialogOpen(false);
      toast({ title: 'Candidate added successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to add candidate', variant: 'destructive' });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error('Failed to update stage');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] });
      toast({ title: 'Stage updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update stage', variant: 'destructive' });
    },
  });

  const candidates = candidatesData?.data || [];

  const rowVirtualizer = useVirtualizer({
    count: candidates.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Candidates</h1>
            <p className="text-muted-foreground mt-1">Manage your candidate pipeline</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={view} onValueChange={(v: any) => setView(v)}>
            <TabsList>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading candidates...</div>
        ) : view === 'kanban' ? (
          <CandidateKanban
            candidates={candidates}
            onStageChange={(id, stage) => updateStageMutation.mutate({ id, stage })}
          />
        ) : (
          <div ref={parentRef} className="h-[calc(100vh-300px)] overflow-auto">
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const candidate = candidates[virtualRow.index];
                return (
                  <Card
                    key={candidate.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="p-4"
                  >
                    <Link to={`/candidates/${candidate.id}`} className="flex items-center justify-between hover:opacity-80">
                      <div>
                        <div className="font-medium">{candidate.name}</div>
                        <div className="text-sm text-muted-foreground">{candidate.email}</div>
                      </div>
                      <Badge variant="secondary">{stageLabels[candidate.stage]}</Badge>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <CandidateFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={(data) => createMutation.mutate(data)}
        />
      </div>
    </Layout>
  );
}
