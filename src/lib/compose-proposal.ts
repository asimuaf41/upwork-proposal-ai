import type { JobAnalysis, ScreeningQuestion } from "./analyze-job";
import {
  BOOST_DEFAULT,
  JOB_TYPE_LINKS,
  LINKS,
  PROFILE,
  SCREENING_ANSWERS,
  type JobType,
} from "./profile";
import { firstContentWord, wordCount } from "./word-count";

function labeledProduct(analysis: JobAnalysis): string {
  const product = analysis.productHint;
  const industry = analysis.industry;
  if (!industry) return product;
  if (product.toLowerCase().includes(industry.toLowerCase())) return product;
  return `${industry} ${product}`;
}

function craftOpening(analysis: JobAnalysis): string {
  const product = labeledProduct(analysis);
  const mirror = analysis.mirrorTerms[0];

  if (analysis.jobType === "field-service") {
    return "A field service platform with technician scheduling, dispatch, and invoicing is exactly the product shape I am currently building.";
  }

  const byAction: Record<string, string> = {
    stabilize: `Stabilizing this ${product} — and shipping what the last developer could not — is production Next.js work I already own for US clients.`,
    takeover: `Taking over this ${product} and making the codebase production-safe is how I work: read the architecture first, then fix what is actually breaking.`,
    audit: `A structured technical audit of this ${product} — severity ratings and written findings before any code changes — is the process I used on a large real estate operations platform.`,
    "integrate-ai": `An AI layer that can read your documents, call tools, and stream answers inside a ${product} is the architecture I already shipped in production.`,
    automate: `Workflow automation around this ${product} — n8n plus a proper Next.js/Node layer when the workflow has to be a product, not a zap — is in-stack.`,
    build: `Building this ${product} as a production Next.js system, not a demo, is the kind of full-stack delivery I run end-to-end.`,
    unknown: `A ${product} that needs to ship and stay stable is the work I take from first commit through production.`,
  };

  let opening = byAction[analysis.primaryAction] ?? byAction.unknown;

  if (mirror && !new RegExp(mirror, "i").test(opening)) {
    // Keep the client's word in the first sentence when it is a verb/domain they used.
    if (/stabiliz|enterprise|field service|multi-tenant/i.test(mirror)) {
      opening = opening.replace(/Stabilizing|production Next\.js/, (chunk) =>
        /stabiliz/i.test(mirror) ? "Stabilizing" : chunk,
      );
    }
  }

  if (/^I\b/i.test(opening)) {
    opening = `This ${product} is the work I take from first commit through production.`;
  }

  return opening;
}

function dashesFor(analysis: JobAnalysis): string[] {
  const links = JOB_TYPE_LINKS[analysis.jobType];
  const type = analysis.jobType;

  const pools: Record<JobType, string[]> = {
    "ai-agent": [
      `Claude API with tool use, streaming, RAG over Supabase pgvector, and a multi-agent loop — live at ${LINKS.agentStudioMulti}`,
      `PDF ingestion and vector search so the agent answers from your documents instead of guessing`,
      `Next.js App Router UI and the agent layer shipped as one system, not a chatbot bolted on later`,
      `Production debugging from the database up — I have already chased silent Supabase RLS failures where the API returned 200 and nothing persisted`,
    ],
    "field-service": [
      `I am currently building exactly this type of platform at OptiField.ai (${LINKS.optifield}) — technician management, job scheduling, dispatch, invoicing`,
      `Multi-tenant architecture with role-based access and real-time job workflows on Next.js, TypeScript, Prisma, PostgreSQL, and Supabase`,
      `Twilio and billing-style integrations are already in that stack, so SMS and invoicing are not a research project`,
      `Same operations-dashboard discipline as the real estate platform I have owned for 2+ years (${LINKS.ourmethodApp})`,
    ],
    "real-estate": [
      `Sole full-stack developer on a large-scale Atlanta real estate operations platform — admin, property manager, and agent roles — ${LINKS.ourmethodApp}`,
      `Stripe, automated emails, PostgreSQL, and 2+ years of maintenance on a live US PropTech codebase`,
      `Public marketing site alongside the operations app: ${LINKS.methodAtlanta}`,
      `Performance work on that same codebase: missing indexes, unnecessary re-renders, no caching on expensive queries — then fixed the slow endpoints`,
    ],
    audit: [
      `Already done this on a real estate operations platform with thousands of files and multiple junior developers — ${LINKS.ourmethodApp}`,
      `Process: structured audit → severity ratings → written root cause analysis before implementing fixes`,
      `Typical finds: missing indexes, unnecessary re-renders, silent auth/RLS failures that look like success in the UI`,
      `I debug from the database up, not from the UI down — logs and raw rows before trusting the API response`,
    ],
    frontend: [
      `Pixel-perfect React/Next.js (App Router, TypeScript, Tailwind) is the core of how I ship — including the production dashboard at ${LINKS.ourmethodApp}`,
      `Responsive, Figma-to-code, and Core Web Vitals work rather than “it looks fine on my laptop”`,
      `When frontend and API fight in production (Vercel + separate host), I have collapsed that into Next.js API routes to eliminate CORS entirely`,
      `State, auth, and data-heavy tables are in-stack: Redux/Zustand, Supabase, REST`,
    ],
    "saas-dashboard": [
      `Large-scale multi-role dashboard already in production: ${LINKS.ourmethodApp}`,
      `Field service SaaS I am currently building with scheduling, roles, and invoicing: ${LINKS.optifield}`,
      `Multi-tenant data isolation with Supabase RLS — tenant data stopped at the database, not only the UI`,
      `Stripe, transactional email, and long-term maintenance (2+ years on the real estate platform)`,
    ],
    "multi-tenant": [
      `Organization-scoped data isolation in production using Supabase RLS — each customer’s data is isolated at the database level`,
      `Live multi-tenant field service SaaS I am currently building: ${LINKS.optifield}`,
      `Multi-role admin/manager/agent access on the real estate operations platform: ${LINKS.ourmethodApp}`,
      `Auth via Supabase (including Google OAuth on the AI studio) and RBAC in the application layer on top of RLS`,
    ],
    supabase: [
      `Supabase Auth, RLS, pgvector, and Storage in production — including AI Agent Studio (${LINKS.agentStudio})`,
      `I have personally fixed a silent RLS failure: UI showed success, rows never wrote, because the anon key was blocked while the API returned 200. Fix was service-role writes server-side plus DB confirmation`,
      `Field service SaaS on the same backend family: ${LINKS.optifield}`,
      `Postgres indexes and query shape are part of how I take over slow dashboards`,
    ],
    automation: [
      `n8n / Make-style workflows when the job is automation — and a Next.js + Claude API product when the workflow has to be a user-facing agent (${LINKS.agentStudio})`,
      `LLM tool-calling plus a real database, so the automation can read/write records rather than only ping Slack`,
      `I will say so if a zap is enough versus when you actually need an app`,
    ],
    "fullstack-mvp": [
      `Full-stack SaaS MVPs on Next.js, TypeScript, Node, and Supabase/PostgreSQL — from blank repo to production on Vercel`,
      `Proof in a live operations platform I still own: ${LINKS.ourmethodApp}`,
      `AI-backed products when the MVP needs an agent layer: ${LINKS.agentStudio}`,
      `Happy to slice the first milestone to a vertical slice you can click, not a slide deck`,
    ],
    vague: [
      `Core delivery is production React/Next.js + Node with Supabase/PostgreSQL for US/UK clients — example: ${LINKS.ourmethodApp}`,
      `AI agent work when that is the product: Claude API, RAG, tool use — ${LINKS.agentStudio}`,
      `I will not invent a 12-week plan until the stack and the first features are explicit`,
    ],
  };

  const selected = [...pools[type]];

  if (analysis.primaryAction === "audit" && type !== "audit") {
    selected.splice(
      2,
      0,
      `When I inherit a messy repo I start with architecture and a written findings list — same approach I used on ${LINKS.ourmethodApp}`,
    );
  }

  if (/\brls\b|silent|not saving|not persist/i.test(analysis.needSummary + analysis.title)) {
    selected.push(
      `I have already fixed a Supabase RLS silent failure: 200 from the API, no row in the table, because the anon key was blocked`,
    );
  }

  // Unique, max 4
  const unique: string[] = [];
  for (const line of selected) {
    if (!unique.includes(line)) unique.push(line);
    if (unique.length === 4) break;
  }

  void links;
  return unique.map((line) => `— ${line}`);
}

function answerQuestion(
  question: ScreeningQuestion,
  analysis: JobAnalysis,
): string {
  const header = question.raw.replace(/\s+/g, " ").trim().replace(/[:?]+$/, "");
  const label = header.length > 90 ? `${header.slice(0, 86)}…` : header;

  switch (question.intent) {
    case "multi-tenant":
      return `**${label}:** ${SCREENING_ANSWERS.multiTenant}`;
    case "ai-tools":
      return `**${label}:** ${SCREENING_ANSWERS.aiTools}`;
    case "codebase":
      return `**${label}:** ${SCREENING_ANSWERS.codebase}`;
    case "debugging":
      return `**${label}:** ${SCREENING_ANSWERS.debugging}`;
    case "availability":
      return `**${label}:** ${SCREENING_ANSWERS.availability}`;
    case "timeline":
      return `**${label}:** Based on the described scope I estimate ${estimateTimeline(analysis)}. I can be more precise once I review the existing codebase / specification.`;
    case "rate":
      return `**${label}:** ${rateFor(analysis)}.`;
    case "experience":
      return `**${label}:** ${experienceAnswer(analysis)}`;
    default:
      return `**${label}:** ${fallbackAnswer(question.raw, analysis)}`;
  }
}

function estimateTimeline(analysis: JobAnalysis): string {
  if (analysis.jobType === "audit") return "3–5 days for a written audit";
  if (analysis.primaryAction === "stabilize") return "1–2 weeks for a first stabilization pass";
  if (analysis.jobType === "ai-agent") return "2–4 weeks for a production RAG/agent slice";
  if (analysis.primaryAction === "build") return "4–6 weeks for a focused MVP slice";
  return "2–4 weeks for a first production milestone";
}

function rateFor(analysis: JobAnalysis): string {
  if (analysis.jobType === "audit") return PROFILE.rates.audit;
  if (analysis.jobType === "ai-agent" || analysis.primaryAction === "integrate-ai") {
    return PROFILE.rates.ai;
  }
  if (analysis.isLongTerm) return PROFILE.rates.longTerm;
  return PROFILE.rates.react;
}

function experienceAnswer(analysis: JobAnalysis): string {
  if (analysis.jobType === "ai-agent") {
    return `Yes — live multi-agent platform with RAG, tool use, and streaming: ${LINKS.agentStudioMulti}`;
  }
  if (analysis.jobType === "field-service") {
    return `Yes — I am currently building a field service SaaS with scheduling, dispatch, and invoicing at ${LINKS.optifield}`;
  }
  if (analysis.jobType === "real-estate") {
    return `Yes — 2+ years as sole full-stack on a US real estate operations platform: ${LINKS.ourmethodApp}`;
  }
  return `7+ years of production React/Next.js and Node for US/UK clients, including ${LINKS.ourmethodApp}`;
}

function fallbackAnswer(raw: string, analysis: JobAnalysis): string {
  if (/\bhallaucin|citation|source/i.test(raw)) {
    return "Citations from retrieved chunks, refuse when retrieval is empty, and log the retrieved passages — I do not ship an agent that cannot show where an answer came from.";
  }
  if (/\brag\b|document/i.test(raw)) {
    return `Yes. AI Agent Studio ingests PDFs into Supabase pgvector and answers from those docs: ${LINKS.agentStudioMulti}`;
  }
  if (/\bstripe|billing|subscription/i.test(raw)) {
    return `Yes — Stripe is in production on the real estate operations platform (${LINKS.ourmethodApp}).`;
  }
  return `Covered in production on the closest project I have shipped (${JOB_TYPE_LINKS[analysis.jobType].primary}). Happy to walk through the exact approach on a short call.`;
}

function niceToHaveParagraph(analysis: JobAnalysis): string | null {
  if (!analysis.partialNotes.length && !analysis.niceToHaveHits.length) {
    return null;
  }
  const honest = analysis.partialNotes.slice(0, 2);
  const have = analysis.niceToHaveHits.filter((s) =>
    ["n8n", "Stripe", "Twilio", "Vercel", "Prisma", "Tailwind", "PostgreSQL", "Supabase"].includes(
      s,
    ),
  );
  const bits: string[] = [];
  if (have.length) {
    bits.push(`From the nice-to-have list I already use ${have.slice(0, 4).join(", ")} in production.`);
  }
  bits.push(...honest);
  if (!bits.length) return null;
  return bits.join(" ");
}

function closing(analysis: JobAnalysis): string {
  if (analysis.budgetWarning) {
    return `Happy to start with a small paid milestone so you can evaluate quality firsthand before committing to full scope — and ${analysis.budgetWarning}.`;
  }
  return "Happy to start with a small paid milestone so you can evaluate quality firsthand before committing to full scope.";
}

function smartQuestions(analysis: JobAnalysis): string[] {
  if (analysis.isVague) {
    return [
      "What is the tech stack today (or the stack you want if this is greenfield)?",
      "What are the specific features for the first milestone (rough list is enough)?",
      "What does the current codebase look like — live app, abandoned repo, or blank?",
    ];
  }

  const qs: string[] = [];

  if (analysis.jobType === "ai-agent") {
    qs.push(
      "Are the source documents PDFs, Google Drive/Notion, or a mix — and do they change often enough to need a re-ingest job?",
    );
    qs.push(
      "Should the agent only answer, or also take actions (create records, trigger workflows) via tools?",
    );
    if (!/\bnext\.js|react|supabase\b/i.test(analysis.stackHits.join(" "))) {
      qs.push("Is this plugging into an existing Next.js/Node app, or greenfield?");
    } else {
      qs.push("Who is allowed to use it on day one — internal staff only, or customers behind a paid gate?");
    }
  } else if (analysis.jobType === "field-service") {
    qs.push("Which roles go live first — dispatcher, technician, customer, or all three?");
    qs.push("Is scheduling a calendar board, an optimize-routes problem, or simple assign-and-go?");
    qs.push("Do technicians need a mobile-web workflow in v1, or desktop dispatch only?");
  } else if (analysis.jobType === "audit" || analysis.primaryAction === "stabilize" || analysis.primaryAction === "takeover") {
    qs.push("Can you share repo access (read-only is enough) and the top 3 production symptoms you see this week?");
    qs.push("Which environment is actually hurting — staging, production, or both?");
    qs.push("Is the goal a written audit first, or start fixing the hottest bugs in the same week?");
  } else if (analysis.jobType === "real-estate") {
    qs.push("Which roles are in v1 — admin, property manager, agent, owner?");
    qs.push("Is MLS / listing sync in scope, or is this internal operations only?");
    qs.push("Are you taking over an existing repo or starting clean?");
  } else {
    qs.push("What does “done” look like for the first paid milestone?");
    qs.push("Is there an existing repo, or is this a blank Next.js app?");
    if (analysis.asksForRate) {
      qs.push("Is this hourly ongoing, or a fixed first milestone with a cap?");
    } else {
      qs.push("Any hard deadline we have to hit for a demo or launch?");
    }
  }

  return qs.slice(0, 3);
}

function footer(analysis: JobAnalysis): string {
  const primary = JOB_TYPE_LINKS[analysis.jobType].primary;
  return [
    `Top Rated Plus | 100% Job Success | $90K+ earned | 7+ years.`,
    `→ ${primary}`,
    `→ GitHub: ${PROFILE.github}`,
    `→ Portfolio: ${PROFILE.portfolio}`,
  ].join("\n");
}

function longTermLine(analysis: JobAnalysis): string | null {
  if (!analysis.isLongTerm) return null;
  return SCREENING_ANSWERS.longTerm;
}

function composeSkipNote(analysis: JobAnalysis): string {
  const reasons = analysis.skipReasons
    .map((r) => r.replace(/\.+$/, ""))
    .join(". ");
  return [
    "Do not apply.",
    `${reasons || "Required stack is outside the offer"}. Do not send a proposal that fakes the skill.`,
    "If they repost this as React, Next.js, Node, Supabase, or Claude/RAG work, it becomes a fit — until then, skip.",
  ].join("\n\n");
}

export function composeProposal(analysis: JobAnalysis): string {
  if (analysis.fit === "skip") {
    return composeSkipNote(analysis);
  }

  const parts: string[] = [];

  if (analysis.filterWord) {
    parts.push(analysis.filterWord);
  }

  parts.push(craftOpening(analysis));
  parts.push(dashesFor(analysis).join("\n"));

  if (analysis.screeningQuestions.length) {
    parts.push(
      analysis.screeningQuestions.map((q) => answerQuestion(q, analysis)).join("\n\n"),
    );
  }

  const nice = niceToHaveParagraph(analysis);
  if (nice) parts.push(nice);

  const longTerm = longTermLine(analysis);
  if (longTerm) parts.push(longTerm);

  parts.push(closing(analysis));

  const questions = smartQuestions(analysis);
  parts.push(questions.map((q, i) => `${i + 1}. ${q}`).join("\n"));

  parts.push(footer(analysis));

  let proposal = parts.filter(Boolean).join("\n\n");
  proposal = enforceRules(proposal, analysis);
  proposal = trimToWordBudget(proposal, analysis);
  return proposal;
}

export function composeBoost(analysis: JobAnalysis): { subject: string; message: string } {
  if (analysis.fit === "skip") {
    return {
      subject: "Do not apply — outside stack",
      message:
        "Do not send a boost on this post. The required stack is outside the offer.",
    };
  }
  if (analysis.jobType === "ai-agent") {
    return {
      subject: "Top Rated Plus — Claude API, RAG, Next.js",
      message:
        "I am a Top Rated Plus full-stack developer with 7+ years building production SaaS and AI agent systems using React, Next.js, Node.js, Claude API, and Supabase — including a live multi-agent platform (ai-agent-platform-nextjs.vercel.app) with RAG, tool use, and streaming. I am available immediately and happy to start with a small paid milestone so you can evaluate quality before committing to full scope.",
    };
  }
  if (analysis.jobType === "field-service") {
    return {
      subject: "Top Rated Plus — Field service SaaS, Next.js",
      message:
        "I am a Top Rated Plus full-stack developer with 7+ years building production SaaS using React, Next.js, Node.js, and Supabase — and I am currently building a field service platform (dashboard.optifield.ai) with scheduling, dispatch, and invoicing. I am available immediately and happy to start with a small paid milestone so you can evaluate quality before committing to full scope.",
    };
  }
  return {
    subject: BOOST_DEFAULT.subject,
    message: BOOST_DEFAULT.message,
  };
}

export function enforceRules(proposal: string, analysis: JobAnalysis): string {
  let text = proposal.replace(/\r\n/g, "\n").trim();

  // Never include Upwork profile URLs
  text = text.replace(/https?:\/\/(www\.)?upwork\.com\S*/gi, "");

  // Strip greasy openers if a model sneaks them in
  text = text.replace(/^(hi[,.]?\s*)?(my name is asim|i am interested|i would love|i am excited)[^\n]*\n+/i, "");

  if (analysis.filterWord) {
    const fw = analysis.filterWord;
    const firstLine = text.split("\n")[0]?.trim() ?? "";
    if (!firstLine.toLowerCase().startsWith(fw.toLowerCase())) {
      text = `${fw}\n\n${text}`;
    }
  }

  const lines = text.split("\n");
  const filterOffset = analysis.filterWord ? 1 : 0;
  let seen = 0;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    seen += 1;
    if (seen === 1 + filterOffset || (!analysis.filterWord && seen === 1)) {
      const isFilterLine =
        analysis.filterWord &&
        trimmed.toLowerCase() === analysis.filterWord.toLowerCase();
      if (!isFilterLine && /^(I|I'm|Hi|Hello)\b/.test(trimmed)) {
        lines[i] = craftOpening(analysis);
      }
      break;
    }
  }
  text = lines.join("\n");

  if (!text.includes(PROFILE.github)) {
    text = `${text.trim()}\n→ GitHub: ${PROFILE.github}`;
  }
  if (!/Top Rated Plus/.test(text)) {
    text = `${text.trim()}\n\n${footer(analysis)}`;
  }

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

function trimToWordBudget(proposal: string, analysis: JobAnalysis): string {
  if (wordCount(proposal) <= 300) return proposal;

  const blocks = proposal.split("\n\n");
  // Drop 4th dash if present
  const dashIndex = blocks.findIndex((b) => b.startsWith("— "));
  if (dashIndex >= 0) {
    const dashes = blocks[dashIndex].split("\n").filter((l) => l.startsWith("— "));
    if (dashes.length > 3) {
      blocks[dashIndex] = dashes.slice(0, 3).join("\n");
    }
  }

  let next = blocks.join("\n\n");
  if (wordCount(next) <= 320) return next;

  // Drop nice-to-have / long-term extras that are not screening answers
  const filtered = blocks.filter((b, i) => {
    if (i < 2) return true;
    if (b.startsWith("**")) return true;
    if (/^Top Rated Plus/.test(b) || b.startsWith("→ ")) return true;
    if (/^\d+\. /.test(b)) return true;
    if (b.startsWith("— ")) return true;
    if (b === craftOpening(analysis)) return true;
    if (analysis.filterWord && b === analysis.filterWord) return true;
    if (b.startsWith("Happy to start")) return true;
    return wordCount(next) > 330 ? !/nice-to-have|longest client/i.test(b) : true;
  });

  next = filtered.join("\n\n");
  return next;
}

export function looksLikeBannedOpener(text: string, filterWord: string | null): boolean {
  const first = firstContentWord(
    filterWord && text.trim().toLowerCase().startsWith(filterWord.toLowerCase())
      ? text.split("\n").slice(1).join("\n")
      : text,
  );
  return /^(I|I'm|Hi|Hello)$/i.test(first);
}
