import Dexie, { Table } from 'dexie';

export interface Job {
  id: string;
  title: string;
  slug: string;
  status: 'active' | 'archived';
  tags: string[];
  order: number;
  description?: string;
  location?: string;
  type?: string;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stage: 'applied' | 'screen' | 'tech' | 'offer' | 'hired' | 'rejected';
  jobId: string;
  appliedAt: string;
  notes?: string;
  resumeUrl?: string;
}

export interface CandidateTimeline {
  id: string;
  candidateId: string;
  fromStage: string | null;
  toStage: string;
  timestamp: string;
  note?: string;
}

export interface Assessment {
  id: string;
  jobId: string;
  title: string;
  sections: AssessmentSection[];
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  id: string;
  type: 'single-choice' | 'multi-choice' | 'short-text' | 'long-text' | 'numeric' | 'file-upload';
  question: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    maxLength?: number;
  };
  conditionalOn?: {
    questionId: string;
    value: string | string[];
  };
}

export interface AssessmentResponse {
  id: string;
  assessmentId: string;
  candidateId: string;
  responses: Record<string, any>;
  submittedAt: string;
}

export class TalentFlowDB extends Dexie {
  jobs!: Table<Job>;
  candidates!: Table<Candidate>;
  candidateTimeline!: Table<CandidateTimeline>;
  assessments!: Table<Assessment>;
  assessmentResponses!: Table<AssessmentResponse>;

  constructor() {
    super('TalentFlowDB');
    this.version(1).stores({
      jobs: 'id, title, slug, status, order',
      candidates: 'id, name, email, stage, jobId',
      candidateTimeline: 'id, candidateId, timestamp',
      assessments: 'id, jobId',
      assessmentResponses: 'id, assessmentId, candidateId',
    });
  }
}

export const db = new TalentFlowDB();
