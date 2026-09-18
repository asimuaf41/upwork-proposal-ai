import type { JobType } from "./profile";

export type Fit = "strong" | "partial" | "skip";

export type PrimaryAction =
  | "stabilize"
  | "build"
  | "audit"
  | "takeover"
  | "integrate-ai"
  | "automate"
  | "unknown";

export type ScreeningIntent =
  | "multi-tenant"
  | "ai-tools"
  | "codebase"
  | "debugging"
  | "timeline"
  | "availability"
  | "rate"
  | "experience"
  | "other";

export type ScreeningQuestion = {
  raw: string;
  intent: ScreeningIntent;
};

export type JobAnalysis = {
  filterWord: string | null;
  jobType: JobType;
  fit: Fit;
  fitReasons: string[];
  skipReasons: string[];
  partialNotes: string[];
  primaryAction: PrimaryAction;
  productHint: string;
  industry: string;
  mirrorTerms: string[];
  stackHits: string[];
  niceToHaveHits: string[];
  missingNiceToHaves: string[];
  screeningQuestions: ScreeningQuestion[];
  asksForRate: boolean;
  asksAvailability: boolean;
  isLongTerm: boolean;
  isVague: boolean;
  budget: string | null;
  budgetWarning: string | null;
  needSummary: string;
  title: string;
};

const FILTER_PATTERNS: RegExp[] = [
  /(?:begin|start)\s+(?:your\s+)?(?:proposal|cover letter|message|application|bid)\s+with(?:\s+the(?:\s+exact)?\s+word)?[:\s]+["“']([^"”']{1,60})["”']/i,
  /(?:with the(?:\s+exact)?\s+word|start with(?:\s+the word)?)\s+["“']?([A-Za-z0-9][A-Za-z0-9\-]*(?:\s+[A-Za-z0-9][A-Za-z0-9\-]*){0,5})["”']?(?=\s+so\b|\s+to\b|[.\n,!]|$)/i,
  /(?:begin|start)\s+(?:your\s+)?(?:proposal|cover letter|message|application|bid)\s+with(?:\s+the(?:\s+exact)?\s+word)?[:\s]+([A-Za-z0-9][A-Za-z0-9 \-]{0,40})/i,
  /first\s+(?:word|line)(?:\s+of\s+your\s+proposal)?\s+(?:should\s+be|must\s+be|is)[:\s]+["“']?([^"”'\n.,]{1,40})["”']?/i,
  /include\s+the\s+word\s+["“']([^"”']+)["”']\s+(?:at\s+the\s+start|as\s+the\s+first\s+word|at\s+the\s+beginning)/i,
  /so\s+we\s+know\s+you\s+read\s+this[^.!?\n]{0,80}(?:start|begin)\s+with[:\s]+["“']?([^"”'\n.,]{1,40})["”']?/i,
];

const MIRROR_TERMS = [
  "stabilize",
  "stabilise",
  "enterprise",
  "field service",
  "multi-tenant",
  "multi tenant",
  "RAG",
  "retrieval-augmented",
  "Claude",
  "take over",
  "takeover",
  "codebase",
  "audit",
  "production",
  "Supabase",
  "RLS",
  "dispatch",
  "scheduling",
  "invoicing",
  "PropTech",
  "real estate",
  "streaming",
  "tool use",
  "tool-calling",
  "vector",
  "pgvector",
  "n8n",
  "Next.js",
  "React",
  "TypeScript",
  "Node.js",
  "admin dashboard",
  "SaaS",
];

const JOB_TYPE_KEYWORDS: { type: JobType; keywords: RegExp; weight: number }[] =
  [
    {
      type: "ai-agent",
      keywords:
        /\b(ai agent|claude api|openai|rag\b|lang(chain|graph)|multi-agent|llm|gpt-4|embeddings|vector (db|database|search)|pgvector|pinecone|tool[- ]use|tool[- ]calling|chatbot|document intelligence)\b/i,
      weight: 4,
    },
    {
      type: "field-service",
      keywords:
        /\b(field service|technician|dispatch|job scheduling|work order|fsm\b)\b/i,
      weight: 5,
    },
    {
      type: "real-estate",
      keywords:
        /\b(real estate|proptech|property manager|listing|mls\b|brokerage)\b/i,
      weight: 4,
    },
    {
      type: "audit",
      keywords:
        /\b(technical audit|code audit|codebase (review|audit|rescue)|performance audit|stabilize|legacy (code|app)|previous developer)\b/i,
      weight: 3,
    },
    {
      type: "automation",
      keywords: /\b(n8n|make\.com|zapier|workflow automation)\b/i,
      weight: 4,
    },
    {
      type: "multi-tenant",
      keywords: /\b(multi[- ]tenant|rbac|role-based)\b/i,
      weight: 3,
    },
    {
      type: "supabase",
      keywords: /\b(supabase|pgvector|row level security|\brls\b)\b/i,
      weight: 3,
    },
    {
      type: "saas-dashboard",
      keywords:
        /\b(saas|admin dashboard|internal tool|operations platform|multi-role dashboard)\b/i,
      weight: 2,
    },
    {
      type: "frontend",
      keywords:
        /\b(react|next\.js|nextjs|figma|tailwind|frontend|front-end|pixel-perfect)\b/i,
      weight: 1,
    },
    {
      type: "fullstack-mvp",
      keywords: /\b(mvp|from scratch|full[- ]stack|web app|saas product)\b/i,
      weight: 1,
    },
  ];

const HARD_SKIP = [
  {
    id: "php",
    re: /\b(laravel|php\b|wordpress|woocommerce|symfony|codeigniter)\b/i,
    label: "PHP / Laravel / WordPress is the required stack",
    alwaysSkip: true,
  },
  {
    id: "django",
    re: /\b(django|flask\b)\b/i,
    label: "Python/Django is the required stack",
    alwaysSkip: true,
  },
  {
    id: "vue",
    re: /\b(vue\.?js|nuxt|vuex)\b/i,
    label: "Vue/Nuxt is the required stack",
    alwaysSkip: true,
  },
  {
    id: "python",
    re: /\bpython\b/i,
    label: "Python is required — not a primary language",
    alwaysSkip: true,
  },
  {
    id: "mobile-native",
    re: /\b(swift\b|kotlin|android native|ios native)\b/i,
    label: "Native mobile (Swift/Kotlin)",
    alwaysSkip: true,
  },
  {
    id: "devops",
    re: /\b(kubernetes|terraform|devops engineer|sre\b|platform engineer)\b/i,
    label: "DevOps / infrastructure-only",
    alwaysSkip: false,
  },
  {
    id: "ml",
    re: /\b(pytorch|tensorflow|model training|data scientist|machine learning engineer)\b/i,
    label: "Data science / ML training",
    alwaysSkip: true,
  },
];

function stripNegatedStack(text: string): string {
  return text.replace(
    /\b(no|not|without|except|don't|dont|do not)\s+(?:need\s+|want\s+|use\s+)?(react|next\.?js|node\.?js|typescript|javascript|supabase|python|php|laravel|vue)\b/gi,
    "",
  );
}

const PARTIAL_SKILLS: { re: RegExp; note: string }[] = [
  {
    re: /\b(wordpress|woocommerce)\b/i,
    note: "WordPress/WooCommerce is not a primary stack — I would handle the surrounding Node/React work, not theme or plugin internals.",
  },
  {
    re: /\bpython\b/i,
    note: "Python is not my primary language. I can integrate Python services from Node/Next.js, but I would not lead a Python codebase.",
  },
  {
    re: /\bgraphql\b/i,
    note: "GraphQL experience is limited versus REST. I can consume GraphQL APIs; I would not sell myself as a GraphQL schema specialist.",
  },
  {
    re: /\bshopify\b/i,
    note: "Shopify app APIs are unfamiliar. I would be honest about that if the job is a Shopify app, not a React storefront.",
  },
  {
    re: /\b(react native|mobile app)\b/i,
    note: "React Native experience is limited versus web. I ship web first; native mobile is not a core offer.",
  },
  {
    re: /\b(aws\b|lambda|ecs|eks)\b/i,
    note: "AWS: EC2, S3, CloudFront, and Lambda are in-stack. Advanced AWS (ECS/EKS/networking) is limited.",
  },
];

const STRONG_STACK =
  /\b(react|next\.js|nextjs|node\.js|nodejs|typescript|javascript|supabase|postgresql|postgres|claude|openai|rag\b|n8n|tailwind|express|nestjs|prisma)\b/i;

function splitRequiredVsNice(jd: string): { required: string; nice: string } {
  const parts = jd.split(
    /nice\s*-?\s*to\s*-?\s*have|bonus\s+skills?|preferred(?:\s+but\s+not\s+required)?|plus\s+if|good\s+to\s+have/i,
  );
  return {
    required: parts[0] ?? jd,
    nice: parts.slice(1).join("\n"),
  };
}

function cleanFilterWord(raw: string): string {
  let word = raw.trim();
  word = word.replace(
    /\s+(so we know|to (?:confirm|prove|show|verify)|if you (?:actually )?read|please)[\s\S]*$/i,
    "",
  );
  word = word.replace(/[.:!?]+$/g, "").trim();
  const parts = word.split(/\s+/).filter(Boolean);
  if (parts.length > 6) word = parts.slice(0, 6).join(" ");
  return word.trim();
}

function extractFilterWord(jd: string): string | null {
  for (const pattern of FILTER_PATTERNS) {
    const match = jd.match(pattern);
    if (match?.[1]) {
      const word = cleanFilterWord(match[1]);
      if (word && word.length <= 60 && !/^https?:/i.test(word)) {
        return word;
      }
    }
  }
  return null;
}

function scoreJobType(jd: string): JobType {
  const cleaned = stripNegatedStack(jd);
  let best: { type: JobType; score: number } = { type: "vague", score: 0 };
  for (const row of JOB_TYPE_KEYWORDS) {
    const hits = cleaned.match(new RegExp(row.keywords, "gi"));
    const score = (hits?.length ?? 0) * row.weight;
    if (score > best.score) best = { type: row.type, score };
  }
  if (best.score === 0) return jd.length < 400 ? "vague" : "fullstack-mvp";
  return best.type;
}

function detectAction(jd: string): PrimaryAction {
  if (/\b(stabiliz|fix bugs|broken|rescue|slow|buggy)\b/i.test(jd)) {
    return "stabilize";
  }
  if (/\b(take over|taking over|existing codebase|previous developer|inherit|handover|hand-off)\b/i.test(jd)) {
    return "takeover";
  }
  if (/\b(audit|code review|assess the (code|repo))\b/i.test(jd)) {
    return "audit";
  }
  if (/\b(claude|openai|rag\b|ai agent|llm|chatbot)\b/i.test(jd)) {
    return "integrate-ai";
  }
  if (/\b(n8n|zapier|make\.com|automat)\b/i.test(jd)) {
    return "automate";
  }
  if (/\b(build|from scratch|mvp|greenfield|create)\b/i.test(jd)) {
    return "build";
  }
  return "unknown";
}

function detectProduct(jd: string): string {
  const candidates: [RegExp, string][] = [
    [/field service/i, "field service platform"],
    [/real estate/i, "real estate platform"],
    [/proptech/i, "PropTech platform"],
    [/\brag\b|document intelligence/i, "document-intelligence system"],
    [/ai agent|multi-agent/i, "AI agent product"],
    [/saas/i, "SaaS product"],
    [/admin dashboard|internal tool/i, "admin dashboard"],
    [/marketplace/i, "marketplace"],
    [/booking|scheduling/i, "scheduling product"],
    [/chatbot/i, "AI chatbot"],
  ];
  for (const [re, label] of candidates) {
    if (re.test(jd)) return label;
  }
  return "web application";
}

function stripFilterInstructions(jd: string): string {
  return jd
    .replace(
      /(?:please\s+)?(?:start|begin)\s+(?:your\s+)?(?:proposal|cover letter|message|application|bid)\s+with[^\n.]*[.\n]?/gi,
      " ",
    )
    .replace(/start\s+with(?:\s+the(?:\s+exact)?\s+word)?[^\n.]*[.\n]?/gi, " ")
    .replace(/so we know you read this[^\n.]*[.\n]?/gi, " ");
}

function detectIndustry(jd: string): string {
  const text = stripFilterInstructions(jd);
  const industries: [RegExp, string][] = [
    [/real estate|proptech/i, "real estate"],
    [/field service|hvac|plumbing|technician/i, "field service"],
    [/health|clinic|radiology|dental/i, "healthcare"],
    [/fintech|payment|stripe|bank/i, "fintech"],
    [/e-?commerce|shopify|store/i, "e-commerce"],
    [/education|course|learning/i, "education"],
    [/legal|law firm/i, "legal"],
    [/logistics|freight/i, "logistics"],
  ];
  for (const [re, label] of industries) {
    if (re.test(text)) return label;
  }
  return "";
}

function extractMirrorTerms(jd: string): string[] {
  const found: string[] = [];
  for (const term of MIRROR_TERMS) {
    const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (re.test(jd)) {
      const match = jd.match(re);
      found.push(match?.[0] ?? term);
    }
  }
  return Array.from(new Set(found)).slice(0, 8);
}

function extractBudget(jd: string): string | null {
  const match = jd.match(
    /\$\s?(\d{2,3}(?:,\d{3})*(?:k)?)(?:\s*(?:-|–|to)\s*\$?\s*(\d{2,3}(?:,\d{3})*(?:k)?))?/i,
  );
  if (!match) return null;
  return match[0].replace(/\s+/g, "");
}

function parseBudgetAmount(budget: string | null): number | null {
  if (!budget) return null;
  const num = budget.replace(/[$,]/g, "").toLowerCase();
  const m = num.match(/(\d+(?:\.\d+)?)(k)?/i);
  if (!m) return null;
  const value = Number(m[1]);
  if (Number.isNaN(value)) return null;
  return m[2] ? value * 1000 : value;
}

function classifyQuestion(raw: string): ScreeningIntent {
  const q = raw.toLowerCase();
  if (/multi[- ]tenant|rls|data isolation|tenant/.test(q)) return "multi-tenant";
  if (/cursor|claude code|ai coding|copilot|ai tool/.test(q)) return "ai-tools";
  if (/existing codebase|take over|legacy|inherit/.test(q)) return "codebase";
  if (/debug|production (issue|bug)|troubleshoot/.test(q)) return "debugging";
  if (/how long|timeline|how many week|eta\b/.test(q)) return "timeline";
  if (/availab|timezone|hours per|overlap/.test(q)) return "availability";
  if (/rate|hourly|how much|pricing|budget/.test(q)) return "rate";
  if (/experience|have you|did you|how many years/.test(q)) return "experience";
  return "other";
}

function extractScreeningQuestions(jd: string): ScreeningQuestion[] {
  const questions: ScreeningQuestion[] = [];
  const numbered =
    jd.match(/(?:^|\n)\s*(?:\d+[.)]|Q\d+[:.)])\s*(.+)/gi) ?? [];
  for (const line of numbered) {
    const cleaned = line.replace(/^\s*(?:\d+[.)]|Q\d+[:.)])\s*/i, "").trim();
    if (
      cleaned.length > 8 &&
      (/[?]/.test(cleaned) ||
        /^(what|how|do you|have you|are you|can you|please|describe|explain)/i.test(
          cleaned,
        ))
    ) {
      questions.push({ raw: cleaned, intent: classifyQuestion(cleaned) });
    }
  }
  if (questions.length === 0) {
    const asked = jd.match(/(?:please (?:answer|include)|questions?:)([\s\S]{0,800})/i);
    if (asked) {
      const lines = asked[1]
        .split("\n")
        .map((l) => l.replace(/^[\s*•-]+/, "").trim())
        .filter((l) => l.length > 8 && l.length < 240);
      for (const line of lines.slice(0, 6)) {
        questions.push({ raw: line, intent: classifyQuestion(line) });
      }
    }
  }
  return questions.slice(0, 8);
}

function extractTitle(jd: string): string {
  const first = jd
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 8 && l.length < 120);
  return first ?? "Upwork job";
}

function extractNeedSummary(
  jd: string,
  product: string,
  action: PrimaryAction,
): string {
  const looking = jd.match(
    /(?:looking for|seeking|need(?:s)?(?: someone to)?|we want)\s+(.{12,140}?)(?:\.|\n|$)/i,
  );
  if (looking?.[1] && !/developer who is/i.test(looking[1])) {
    const snippet = looking[1].replace(/\s+/g, " ").trim();
    if (!/^a[n]?\s+(senior|fullstack|full-stack|react)/i.test(snippet)) {
      return snippet;
    }
  }
  const actionPhrase: Record<PrimaryAction, string> = {
    stabilize: `stabilizing this ${product}`,
    build: `building this ${product} from scratch`,
    audit: `a technical audit of this ${product}`,
    takeover: `taking over this ${product} codebase`,
    "integrate-ai": `adding AI agents to this ${product}`,
    automate: `automating workflows around this ${product}`,
    unknown: `shipping this ${product} to production`,
  };
  return actionPhrase[action];
}

function collectStackHits(text: string): string[] {
  const skills = [
    "React",
    "Next.js",
    "TypeScript",
    "Node.js",
    "Supabase",
    "PostgreSQL",
    "Claude",
    "OpenAI",
    "RAG",
    "n8n",
    "Tailwind",
    "Prisma",
    "NestJS",
    "Express",
    "GraphQL",
    "React Native",
    "Python",
    "AWS",
    "Vercel",
    "Stripe",
    "Twilio",
  ];
  return skills.filter((s) =>
    new RegExp(`\\b${s.replace(".", "\\.")}\\b`, "i").test(text),
  );
}

export function analyzeJob(jd: string): JobAnalysis {
  const text = jd.trim();
  const { required, nice } = splitRequiredVsNice(text);
  const jobType = scoreJobType(text);
  const primaryAction = detectAction(text);
  const productHint = detectProduct(text);
  const industry = detectIndustry(text);
  const filterWord = extractFilterWord(text);
  const mirrorTerms = extractMirrorTerms(text);
  const screeningQuestions = extractScreeningQuestions(text);
  const budget = extractBudget(text);
  const budgetAmount = parseBudgetAmount(budget);
  const stackHits = collectStackHits(required);

  const skipReasons: string[] = [];
  const requiredHasStrong = STRONG_STACK.test(stripNegatedStack(required));

  for (const skip of HARD_SKIP) {
    if (!skip.re.test(required)) continue;
    if (skip.alwaysSkip || !requiredHasStrong) {
      skipReasons.push(skip.label);
    }
  }

  if (
    /\b(laravel|django|wordpress)\b/i.test(extractTitle(text)) &&
    !requiredHasStrong
  ) {
    skipReasons.push("Title is a stack outside Asim's offer");
  }

  const partialNotes: string[] = [];
  for (const skill of PARTIAL_SKILLS) {
    if (skill.re.test(required) && !skill.re.test(nice.split("\n")[0] ?? "")) {
      if (skill.re.test(nice) && !skill.re.test(required)) continue;
      if (requiredHasStrong) {
        partialNotes.push(skill.note);
      } else if (!skipReasons.length) {
        partialNotes.push(skill.note);
      }
    } else if (skill.re.test(nice)) {
      partialNotes.push(skill.note);
    }
  }

  const fitReasons: string[] = [];
  if (requiredHasStrong) fitReasons.push("Core stack matches React/Next.js/Node or AI");
  if (jobType === "ai-agent") fitReasons.push("AI agent / RAG / Claude API job");
  if (jobType === "field-service") fitReasons.push("Field service / scheduling job");
  if (jobType === "real-estate") fitReasons.push("PropTech / real estate job");
  if (jobType === "audit") fitReasons.push("Codebase audit / stabilize job");

  const uniqueSkip = Array.from(new Set(skipReasons));

  let fit: Fit = "strong";
  if (uniqueSkip.length) fit = "skip";
  else if (partialNotes.length) fit = "partial";
  else if (!requiredHasStrong && (jobType === "vague" || text.length < 200)) {
    fit = "partial";
  }

  const isVague =
    (jobType === "vague" || jobType === "fullstack-mvp") &&
    !requiredHasStrong &&
    screeningQuestions.length === 0 &&
    text.length < 500;

  let budgetWarning: string | null = null;
  if (budgetAmount !== null) {
    const looksLikeHourly = /hour|hr\b|hourly/i.test(text) && budgetAmount <= 200;
    const looksLikeMvp =
      /\b(mvp|saas|from scratch|full(-|\s)?app|platform)\b/i.test(text);
    if (!looksLikeHourly && looksLikeMvp && budgetAmount < 1500) {
      budgetWarning =
        "worth discussing scope to confirm what fits within the budget";
    }
    if (looksLikeHourly && budgetAmount < 25) {
      budgetWarning =
        "worth discussing scope to confirm what fits within the budget";
    }
  }

  const missingNiceToHaves: string[] = [];
  if (/\bpython\b/i.test(nice)) missingNiceToHaves.push("Python as a primary language");
  if (/\bgraphql\b/i.test(nice)) missingNiceToHaves.push("deep GraphQL schema work");
  if (/\bshopify\b/i.test(nice)) missingNiceToHaves.push("Shopify app APIs");

  const niceToHaveHitsFiltered = collectStackHits(nice);

  return {
    filterWord,
    jobType: isVague ? "vague" : jobType,
    fit,
    fitReasons,
    skipReasons: uniqueSkip,
    partialNotes,
    primaryAction,
    productHint,
    industry,
    mirrorTerms,
    stackHits,
    niceToHaveHits: niceToHaveHitsFiltered,
    missingNiceToHaves,
    screeningQuestions,
    asksForRate: /hourly rate|your rate|what is your rate|budget hourly/i.test(text),
    asksAvailability: /availability|timezone|hours (per|\/)\s*week/i.test(text),
    isLongTerm:
      /\b(long[- ]term|ongoing|part[- ]time|20\s*hrs?|retainer|dedicated)\b/i.test(
        text,
      ),
    isVague,
    budget,
    budgetWarning,
    needSummary: extractNeedSummary(text, productHint, primaryAction),
    title: extractTitle(text),
  };
}
