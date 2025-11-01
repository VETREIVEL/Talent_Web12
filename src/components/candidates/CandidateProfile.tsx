import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const stageLabels: Record<string, string> = {
  applied: 'Applied',
  screen: 'Screening',
  tech: 'Technical',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

const stageColors: Record<string, string> = {
  applied: 'bg-blue-500',
  screen: 'bg-yellow-500',
  tech: 'bg-purple-500',
  offer: 'bg-green-500',
  hired: 'bg-emerald-500',
  rejected: 'bg-red-500',
};

export default function CandidateProfile() {
  const { id } = useParams();

  const { data: candidate } = useQuery({
    queryKey: ['candidate', id],
    queryFn: async () => {
      const res = await fetch(`/api/candidates?search=${id}`);
      const data = await res.json();
      return data.data.find((c: any) => c.id === id);
    },
  });

  const { data: timeline } = useQuery({
    queryKey: ['candidate-timeline', id],
    queryFn: async () => {
      const res = await fetch(`/api/candidates/${id}/timeline`);
      return res.json();
    },
    enabled: !!id,
  });

  const { data: job } = useQuery({
    queryKey: ['job', candidate?.jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs?search=${candidate.jobId}`);
      const data = await res.json();
      return data.data.find((j: any) => j.id === candidate.jobId);
    },
    enabled: !!candidate?.jobId,
  });

  if (!candidate) {
    return (
      <Layout>
        <div className="text-center py-12">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/candidates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{candidate.name}</h1>
            <p className="text-muted-foreground">Candidate Profile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <h2 className="font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{candidate.email}</span>
              </div>
              {candidate.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{candidate.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Applied {format(new Date(candidate.appliedAt), 'MMM d, yyyy')}</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium mb-2">Current Stage</h3>
              <Badge className={`${stageColors[candidate.stage]} text-white`}>
                {stageLabels[candidate.stage]}
              </Badge>
            </div>

            {job && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Applied For</h3>
                <Link to={`/jobs`} className="text-sm text-primary hover:underline">
                  {job.title}
                </Link>
              </div>
            )}

            {candidate.notes && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{candidate.notes}</p>
              </div>
            )}
          </Card>

          <Card className="p-6 md:col-span-2">
            <h2 className="font-semibold mb-4">Timeline</h2>
            <div className="space-y-4">
              {timeline?.map((event: any, index: number) => (
                <div key={event.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${stageColors[event.toStage]}`} />
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-border mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      {event.fromStage ? (
                        <span className="text-sm">
                          Moved from <strong>{stageLabels[event.fromStage]}</strong> to{' '}
                          <strong>{stageLabels[event.toStage]}</strong>
                        </span>
                      ) : (
                        <span className="text-sm">
                          Applied as <strong>{stageLabels[event.toStage]}</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(event.timestamp), 'MMM d, yyyy h:mm a')}
                    </p>
                    {event.note && (
                      <p className="text-sm mt-2 p-2 bg-muted rounded">{event.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
