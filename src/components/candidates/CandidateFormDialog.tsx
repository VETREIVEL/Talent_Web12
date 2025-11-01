import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';

const candidateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  jobId: z.string().min(1, 'Job is required'),
  stage: z.enum(['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']),
  notes: z.string().optional(),
});

type CandidateForm = z.infer<typeof candidateSchema>;

interface CandidateFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CandidateForm) => void;
}

export function CandidateFormDialog({ open, onOpenChange, onSubmit }: CandidateFormDialogProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CandidateForm>({
    resolver: zodResolver(candidateSchema),
    defaultValues: { stage: 'applied' },
  });

  const { data: jobsData } = useQuery({
    queryKey: ['jobs', 'active'],
    queryFn: async () => {
      const res = await fetch('/api/jobs?status=active&pageSize=100');
      return res.json();
    },
  });

  const selectedStage = watch('stage');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Candidate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div>
              <Label htmlFor="jobId">Job *</Label>
              <Select onValueChange={(value) => setValue('jobId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  {jobsData?.data?.map((job: any) => (
                    <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.jobId && <p className="text-sm text-destructive mt-1">{errors.jobId.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="stage">Stage</Label>
            <Select value={selectedStage} onValueChange={(value: any) => setValue('stage', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="screen">Screening</SelectItem>
                <SelectItem value="tech">Technical</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register('notes')} rows={3} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Add Candidate</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
