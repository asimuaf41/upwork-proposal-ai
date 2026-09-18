export const PROFILE = {
  name: "Asim Ali",
  title: "Senior Full-Stack Developer and AI Agent Engineer",
  location: "Lahore, Pakistan",
  timezone: "PKT, UTC+5",
  experienceYears: "7+",
  upwork: {
    status: "Top Rated Plus",
    jss: "100% Job Success",
    earned: "$90K+",
    hours: "6,200+",
    since: "2021",
  },
  github: "https://github.com/asimuaf41",
  portfolio: "https://asimportfolio-6fd1d.web.app/",
  rates: {
    react: "$35–45/hour",
    ai: "$45–55/hour",
    audit: "$50–60/hour",
    longTerm: "$40–50/hour",
  },
} as const;

export const LINKS = {
  ourmethodApp: "https://app.ourmethod.com",
  methodAtlanta: "https://methodatlanta.com",
  agentStudio: "https://ai-agent-platform-nextjs.vercel.app/",
  agentStudioMulti: "https://ai-agent-platform-nextjs.vercel.app/multi-agent",
  optifield: "https://dashboard.optifield.ai",
} as const;

export type JobType =
  | "frontend"
  | "ai-agent"
  | "field-service"
  | "real-estate"
  | "saas-dashboard"
  | "multi-tenant"
  | "supabase"
  | "automation"
  | "audit"
  | "fullstack-mvp"
  | "vague";

export const JOB_TYPE_LINKS: Record<
  JobType,
  { primary: string; secondary?: string }
> = {
  frontend: { primary: LINKS.ourmethodApp, secondary: LINKS.agentStudio },
  "ai-agent": { primary: LINKS.agentStudio, secondary: LINKS.optifield },
  "field-service": { primary: LINKS.optifield, secondary: LINKS.ourmethodApp },
  "real-estate": { primary: LINKS.ourmethodApp, secondary: LINKS.methodAtlanta },
  "saas-dashboard": { primary: LINKS.ourmethodApp, secondary: LINKS.optifield },
  "multi-tenant": { primary: LINKS.optifield, secondary: LINKS.ourmethodApp },
  supabase: { primary: LINKS.agentStudio, secondary: LINKS.optifield },
  automation: { primary: LINKS.agentStudio },
  audit: { primary: LINKS.ourmethodApp },
  "fullstack-mvp": { primary: LINKS.ourmethodApp, secondary: LINKS.optifield },
  vague: { primary: LINKS.ourmethodApp, secondary: LINKS.agentStudio },
};

export const BOOST_DEFAULT = {
  subject: "Top Rated Plus React & AI Developer — Available Now",
  message:
    "I am a Top Rated Plus full-stack developer with 7+ years building production SaaS platforms using React, Next.js, Node.js, and Supabase for US clients — including a large-scale real estate operations platform (app.ourmethod.com) and a live multi-agent AI platform (ai-agent-platform-nextjs.vercel.app). My background covers everything from complex admin dashboards and REST API integrations to Supabase auth, RLS, and AI agent development with Claude API. I am available immediately and happy to start with a small paid milestone so you can evaluate quality before committing to full scope.",
};

export const SCREENING_ANSWERS = {
  multiTenant:
    "I have implemented organization-scoped data isolation in production using Supabase RLS policies — each customer's data is isolated at the database level, not just the application layer.",
  aiTools:
    "I use Cursor Pro and Claude Code daily. I treat every AI-generated output as a junior developer's PR — I read it, verify edge cases, check error handling, and test actual behavior before merging. AI handles volume, I handle correctness.",
  codebase:
    "I start by reading architecture before touching individual files — understanding data flow from frontend through API to database. I then audit for inconsistent patterns, missing error handling, and security gaps before making any changes.",
  debugging:
    "I debug from the database up, not from the UI down. I check logs and raw data before assuming the API response is accurate.",
  availability:
    "Available immediately. I work remotely from Pakistan (PKT, UTC+5) with morning overlap for US Eastern time check-ins.",
  longTerm:
    "My current longest client engagement is 2+ years. I prefer long-term relationships over one-off projects.",
} as const;
