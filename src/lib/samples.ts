export type SampleJob = {
  id: string;
  label: string;
  title: string;
  text: string;
};

export const SAMPLE_JOBS: SampleJob[] = [
  {
    id: "ai-rag",
    label: "AI / RAG",
    title: "Claude API + RAG agent for internal documents",
    text: `Need a Next.js developer to build an AI agent that answers staff questions from our internal PDFs.

We are a US operations team. We need a production RAG system using Claude API (or OpenAI), document ingestion, vector search, and a streaming chat UI inside our existing SaaS.

Stack: Next.js (App Router), TypeScript, Supabase, PostgreSQL.

Must haves:
- Claude API tool use
- PDF ingestion and retrieval-augmented generation
- Auth so only our team can use it
- Streaming responses

Nice to have: n8n automation to re-ingest when files change, experience with pgvector.

Please start your proposal with the word RADIOLOGY so we know you read this.

Questions:
1. Have you shipped a RAG system in production?
2. What is your hourly rate?
3. How do you handle hallucinations / citations?

Budget: $40-50/hour. Long-term if this works. Available to start immediately.`,
  },
  {
    id: "stabilize",
    label: "Stabilize SaaS",
    title: "Take over a buggy Next.js SaaS dashboard",
    text: `We need someone to stabilize our React/Next.js SaaS dashboard after the previous developer left.

The app is in production for a US real estate company. Admin + manager roles, Stripe billing, lots of bugs, slow queries, and features that never shipped.

Stack: Next.js, Node.js, PostgreSQL, some Supabase.

Looking for a senior full-stack developer who can audit the codebase, fix production issues, and keep building.

Please answer:
1. How do you take over an existing codebase?
2. Experience with multi-tenant / RBAC?
3. Timeline for an initial audit?

Hourly, ongoing, ~20hrs/week.`,
  },
  {
    id: "field",
    label: "Field service",
    title: "Field service scheduling + dispatch platform",
    text: `Building a field service SaaS: technician management, job scheduling, dispatch, invoicing.

Need a full-stack Next.js + TypeScript developer. Multi-tenant, role-based access, real-time updates when jobs change.

Stripe for billing. Twilio for SMS. PostgreSQL.

This is an MVP we want in production, not a demo.

Start with the word DISPATCH.`,
  },
];
