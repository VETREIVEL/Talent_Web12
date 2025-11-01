import { faker } from '@faker-js/faker';
import { db, Job, Candidate, CandidateTimeline, Assessment } from './db';

const JOB_TITLES = [
  'Senior Frontend Engineer',
  'Backend Developer',
  'Full Stack Engineer',
  'DevOps Engineer',
  'Product Manager',
  'UX Designer',
  'Data Scientist',
  'Mobile Developer',
  'QA Engineer',
  'Engineering Manager',
  'Technical Writer',
  'Sales Engineer',
  'Customer Success Manager',
  'Marketing Manager',
  'HR Business Partner',
  'Financial Analyst',
  'Operations Manager',
  'Security Engineer',
  'Machine Learning Engineer',
  'Solutions Architect',
  'Business Analyst',
  'Scrum Master',
  'Technical Recruiter',
  'Product Designer',
  'Content Strategist',
];

const TAGS = [
  'Remote',
  'Hybrid',
  'On-site',
  'Full-time',
  'Contract',
  'Senior',
  'Mid-level',
  'Junior',
  'Urgent',
  'Featured',
];

const STAGES = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'] as const;

export async function seedDatabase() {
  // Check if already seeded
  const existingJobs = await db.jobs.count();
  if (existingJobs > 0) {
    console.log('Database already seeded');
    return;
  }

  console.log('Seeding database...');

  // Seed jobs
  const jobs: Job[] = [];
  for (let i = 0; i < 25; i++) {
    const title = JOB_TITLES[i % JOB_TITLES.length];
    const slug = `${title.toLowerCase().replace(/\s+/g, '-')}-${i}`;
    jobs.push({
      id: `job-${i + 1}`,
      title,
      slug,
      status: Math.random() > 0.3 ? 'active' : 'archived',
      tags: faker.helpers.arrayElements(TAGS, { min: 2, max: 4 }),
      order: i,
      description: faker.lorem.paragraphs(2),
      location: faker.location.city(),
      type: faker.helpers.arrayElement(['Full-time', 'Contract', 'Part-time']),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    });
  }
  await db.jobs.bulkAdd(jobs);

  // Seed candidates
  const candidates: Candidate[] = [];
  const timelines: CandidateTimeline[] = [];
  
  for (let i = 0; i < 1000; i++) {
    const jobId = faker.helpers.arrayElement(jobs).id;
    const stage = faker.helpers.arrayElement(STAGES);
    const appliedAt = faker.date.past({ years: 1 });
    
    const candidate: Candidate = {
      id: `candidate-${i + 1}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      stage,
      jobId,
      appliedAt: appliedAt.toISOString(),
      notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.3 }),
    };
    candidates.push(candidate);

    // Create timeline for this candidate
    timelines.push({
      id: `timeline-${i + 1}-1`,
      candidateId: candidate.id,
      fromStage: null,
      toStage: 'applied',
      timestamp: appliedAt.toISOString(),
    });

    // Add some stage transitions
    if (stage !== 'applied') {
      const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
      const currentIndex = stages.indexOf(stage);
      
      for (let j = 1; j <= currentIndex; j++) {
        const transitionDate = new Date(appliedAt);
        transitionDate.setDate(transitionDate.getDate() + j * 3);
        
        timelines.push({
          id: `timeline-${i + 1}-${j + 1}`,
          candidateId: candidate.id,
          fromStage: stages[j - 1],
          toStage: stages[j],
          timestamp: transitionDate.toISOString(),
          note: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.5 }),
        });
      }
    }
  }
  await db.candidates.bulkAdd(candidates);
  await db.candidateTimeline.bulkAdd(timelines);

  // Seed assessments
  const assessments: Assessment[] = [];
  const assessmentJobs = faker.helpers.arrayElements(jobs, 5);
  
  assessmentJobs.forEach((job, idx) => {
    const sections = [];
    
    for (let i = 0; i < faker.number.int({ min: 2, max: 4 }); i++) {
      const questions = [];
      
      for (let j = 0; j < faker.number.int({ min: 3, max: 5 }); j++) {
        const questionTypes = ['single-choice', 'multi-choice', 'short-text', 'long-text', 'numeric', 'file-upload'] as const;
        const type = faker.helpers.arrayElement(questionTypes);
        
        const question: any = {
          id: `q-${idx}-${i}-${j}`,
          type,
          question: faker.lorem.sentence() + '?',
          required: faker.datatype.boolean(),
        };

        if (type === 'single-choice' || type === 'multi-choice') {
          question.options = Array.from({ length: 4 }, (_, k) => 
            faker.helpers.arrayElement([
              'Strongly Agree',
              'Agree',
              'Neutral',
              'Disagree',
              'Strongly Disagree',
              'Yes',
              'No',
              'Maybe',
              faker.lorem.words(3),
            ])
          );
        }

        if (type === 'numeric') {
          question.validation = {
            min: 0,
            max: 100,
          };
        }

        if (type === 'short-text' || type === 'long-text') {
          question.validation = {
            maxLength: type === 'short-text' ? 100 : 1000,
          };
        }

        // Add conditional logic to some questions
        if (j > 0 && faker.datatype.boolean({ probability: 0.2 })) {
          const prevQuestion = questions[j - 1];
          if (prevQuestion.type === 'single-choice' && prevQuestion.options) {
            question.conditionalOn = {
              questionId: prevQuestion.id,
              value: prevQuestion.options[0],
            };
          }
        }

        questions.push(question);
      }

      sections.push({
        id: `section-${idx}-${i}`,
        title: faker.company.buzzPhrase(),
        description: faker.lorem.sentence(),
        questions,
      });
    }

    assessments.push({
      id: `assessment-${idx + 1}`,
      jobId: job.id,
      title: `${job.title} Assessment`,
      sections,
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString(),
    });
  });
  
  await db.assessments.bulkAdd(assessments);

  console.log('Database seeded successfully!');
}
