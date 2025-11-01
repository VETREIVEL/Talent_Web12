import { http, HttpResponse, delay } from 'msw';
import { db } from '@/lib/db';

// Simulate network latency and random errors
async function simulateNetwork() {
  await delay(faker.number.int({ min: 200, max: 1200 }));
  
  // 5-10% chance of error on write operations
  if (Math.random() < 0.075) {
    throw new Error('Simulated network error');
  }
}

// Import faker for random delays
import { faker } from '@faker-js/faker';

export const handlers = [
  // Jobs endpoints
  http.get('/api/jobs', async ({ request }) => {
    await simulateNetwork();
    
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const sort = url.searchParams.get('sort') || 'order';

    let jobs = await db.jobs.toArray();

    // Filter
    if (search) {
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }

    // Sort
    jobs.sort((a, b) => {
      if (sort === 'order') return a.order - b.order;
      if (sort === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

    // Paginate
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedJobs = jobs.slice(start, end);

    return HttpResponse.json({
      data: paginatedJobs,
      total: jobs.length,
      page,
      pageSize,
      totalPages: Math.ceil(jobs.length / pageSize),
    });
  }),

  http.post('/api/jobs', async ({ request }) => {
    await simulateNetwork();
    
    const body = await request.json() as any;
    const job = {
      ...body,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    await db.jobs.add(job);
    return HttpResponse.json(job, { status: 201 });
  }),

  http.patch('/api/jobs/:id', async ({ request, params }) => {
    await simulateNetwork();
    
    const { id } = params;
    const updates = await request.json() as any;
    
    await db.jobs.update(id as string, updates);
    const job = await db.jobs.get(id as string);
    
    return HttpResponse.json(job);
  }),

  http.patch('/api/jobs/:id/reorder', async ({ request, params }) => {
    await simulateNetwork();
    
    const { id } = params;
    const { fromOrder, toOrder } = await request.json() as any;
    
    const jobs = await db.jobs.orderBy('order').toArray();
    const job = jobs.find(j => j.id === id);
    
    if (!job) {
      return HttpResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Reorder logic
    if (fromOrder < toOrder) {
      // Moving down
      const jobsToUpdate = await db.jobs
        .where('order')
        .between(fromOrder + 1, toOrder, true, true)
        .toArray();
      
      for (const j of jobsToUpdate) {
        await db.jobs.update(j.id, { order: j.order - 1 });
      }
    } else {
      // Moving up
      const jobsToUpdate = await db.jobs
        .where('order')
        .between(toOrder, fromOrder - 1, true, true)
        .toArray();
      
      for (const j of jobsToUpdate) {
        await db.jobs.update(j.id, { order: j.order + 1 });
      }
    }
    
    await db.jobs.update(id as string, { order: toOrder });
    
    return HttpResponse.json({ success: true });
  }),

  // Candidates endpoints
  http.get('/api/candidates', async ({ request }) => {
    await simulateNetwork();
    
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const stage = url.searchParams.get('stage') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '50');

    let candidates = await db.candidates.toArray();

    // Filter
    if (search) {
      candidates = candidates.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (stage) {
      candidates = candidates.filter(c => c.stage === stage);
    }

    // Sort by applied date (newest first)
    candidates.sort((a, b) => 
      new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
    );

    // Paginate
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedCandidates = candidates.slice(start, end);

    return HttpResponse.json({
      data: paginatedCandidates,
      total: candidates.length,
      page,
      pageSize,
      totalPages: Math.ceil(candidates.length / pageSize),
    });
  }),

  http.post('/api/candidates', async ({ request }) => {
    await simulateNetwork();
    
    const body = await request.json() as any;
    const candidate = {
      ...body,
      id: `candidate-${Date.now()}`,
      appliedAt: new Date().toISOString(),
    };
    
    await db.candidates.add(candidate);
    
    // Create initial timeline entry
    await db.candidateTimeline.add({
      id: `timeline-${Date.now()}`,
      candidateId: candidate.id,
      fromStage: null,
      toStage: candidate.stage,
      timestamp: candidate.appliedAt,
    });
    
    return HttpResponse.json(candidate, { status: 201 });
  }),

  http.patch('/api/candidates/:id', async ({ request, params }) => {
    await simulateNetwork();
    
    const { id } = params;
    const updates = await request.json() as any;
    
    const candidate = await db.candidates.get(id as string);
    
    if (!candidate) {
      return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // If stage is changing, create timeline entry
    if (updates.stage && updates.stage !== candidate.stage) {
      await db.candidateTimeline.add({
        id: `timeline-${Date.now()}`,
        candidateId: id as string,
        fromStage: candidate.stage,
        toStage: updates.stage,
        timestamp: new Date().toISOString(),
        note: updates.note,
      });
    }
    
    await db.candidates.update(id as string, updates);
    const updatedCandidate = await db.candidates.get(id as string);
    
    return HttpResponse.json(updatedCandidate);
  }),

  http.get('/api/candidates/:id/timeline', async ({ params }) => {
    await simulateNetwork();
    
    const { id } = params;
    const timeline = await db.candidateTimeline
      .where('candidateId')
      .equals(id as string)
      .sortBy('timestamp');
    
    return HttpResponse.json(timeline);
  }),

  // Assessments endpoints
  http.get('/api/assessments/:jobId', async ({ params }) => {
    await simulateNetwork();
    
    const { jobId } = params;
    const assessment = await db.assessments
      .where('jobId')
      .equals(jobId as string)
      .first();
    
    return HttpResponse.json(assessment || null);
  }),

  http.put('/api/assessments/:jobId', async ({ request, params }) => {
    await simulateNetwork();
    
    const { jobId } = params;
    const body = await request.json() as any;
    
    const existing = await db.assessments
      .where('jobId')
      .equals(jobId as string)
      .first();
    
    if (existing) {
      await db.assessments.update(existing.id, {
        ...body,
        updatedAt: new Date().toISOString(),
      });
      return HttpResponse.json(await db.assessments.get(existing.id));
    } else {
      const assessment = {
        ...body,
        id: `assessment-${Date.now()}`,
        jobId: jobId as string,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.assessments.add(assessment);
      return HttpResponse.json(assessment, { status: 201 });
    }
  }),

  http.post('/api/assessments/:jobId/submit', async ({ request, params }) => {
    await simulateNetwork();
    
    const { jobId } = params;
    const body = await request.json() as any;
    
    const response = {
      id: `response-${Date.now()}`,
      assessmentId: body.assessmentId,
      candidateId: body.candidateId,
      responses: body.responses,
      submittedAt: new Date().toISOString(),
    };
    
    await db.assessmentResponses.add(response);
    return HttpResponse.json(response, { status: 201 });
  }),
];
