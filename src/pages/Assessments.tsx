import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AssessmentBuilder } from '@/components/assessments/AssessmentBuilder';
import { AssessmentPreview } from '@/components/assessments/AssessmentPreview';
import { AssessmentSection } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export default function Assessments() {
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [sections, setSections] = useState<AssessmentSection[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/jobs?status=active&pageSize=100');
      return res.json();
    },
  });

  const { data: assessment, isLoading } = useQuery({
    queryKey: ['assessment', selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return null;
      const res = await fetch(`/api/assessments/${selectedJobId}`);
      return res.json();
    },
    enabled: !!selectedJobId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedJobId) throw new Error('No job selected');
      const res = await fetch(`/api/assessments/${selectedJobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Assessment', sections }),
      });
      if (!res.ok) throw new Error('Failed to save assessment');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment', selectedJobId] });
      toast({ title: 'Assessment saved successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to save assessment', variant: 'destructive' });
    },
  });

  // Load assessment when data changes
  useState(() => {
    if (assessment?.sections) {
      setSections(assessment.sections);
    }
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Assessments</h1>
            <p className="text-muted-foreground mt-1">Create and manage job assessments</p>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={!selectedJobId || saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Saving...' : 'Save Assessment'}
          </Button>
        </div>

        <Card className="p-4">
          <Label htmlFor="job-select">Select Job</Label>
          <Select value={selectedJobId} onValueChange={(value) => {
            setSelectedJobId(value);
            setSections([]);
          }}>
            <SelectTrigger id="job-select" className="mt-2">
              <SelectValue placeholder="Choose a job to create an assessment" />
            </SelectTrigger>
            <SelectContent>
              {jobsData?.data?.map((job: any) => (
                <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {selectedJobId && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Builder</h2>
              {isLoading ? (
                <div className="text-center py-12">Loading assessment...</div>
              ) : (
                <AssessmentBuilder sections={sections} onChange={setSections} />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
              <AssessmentPreview sections={sections} />
            </div>
          </div>
        )}

        {!selectedJobId && (
          <div className="text-center py-12 text-muted-foreground">
            Select a job to create or edit an assessment
          </div>
        )}
      </div>
    </Layout>
  );
}
