import { analyzeJob, type JobAnalysis } from "./analyze-job";
import { composeBoost, composeProposal, enforceRules } from "./compose-proposal";
import { PROFILE } from "./profile";
import { SYSTEM_PROMPT } from "./system-prompt";
import { wordCount } from "./word-count";

export type GenerateResult = {
  proposal: string;
  boost: { subject: string; message: string };
  analysis: JobAnalysis;
  source: "local" | "claude" | "openai";
  wordCount: number;
  warnings: string[];
};

export type GenerateOptions = {
  provider?: "auto" | "local" | "claude" | "openai";
  anthropicKey?: string;
  openaiKey?: string;
};

export async function generateProposal(
  jobDescription: string,
  options: GenerateOptions = {},
): Promise<GenerateResult> {
  const jd = jobDescription.trim();
  if (jd.length < 20) {
    throw new Error("Paste the full job description first.");
  }

  const analysis = analyzeJob(jd);
  const warnings: string[] = [];

  if (analysis.fit === "skip") {
    warnings.push(
      `Do not apply: ${analysis.skipReasons.join("; ") || "stack is outside the offer"}.`,
    );
  } else if (analysis.fit === "partial") {
    warnings.push("Partial fit — the proposal stays honest about the gaps.");
  }
  if (analysis.filterWord) {
    warnings.push(`Filter word detected: “${analysis.filterWord}” — placed on line 1.`);
  }
  if (analysis.budgetWarning) {
    warnings.push(`Budget looks tight — ${analysis.budgetWarning}.`);
  }

  const provider = options.provider ?? "auto";
  let source: GenerateResult["source"] = "local";
  let proposal = composeProposal(analysis);

  const canClaude =
    (provider === "auto" || provider === "claude") &&
    Boolean(options.anthropicKey);
  const canOpenAI =
    (provider === "auto" || provider === "openai") && Boolean(options.openaiKey);

  if (provider !== "local" && (canClaude || canOpenAI)) {
    try {
      if (canClaude && options.anthropicKey) {
        proposal = await generateWithClaude(jd, analysis, options.anthropicKey);
        source = "claude";
      } else if (canOpenAI && options.openaiKey) {
        proposal = await generateWithOpenAI(jd, analysis, options.openaiKey);
        source = "openai";
      }
      proposal = enforceRules(proposal, analysis);
      if (wordCount(proposal) > 360) {
        warnings.push("Model ran long — fell back to the rules engine.");
        proposal = composeProposal(analysis);
        source = "local";
      }
    } catch (error) {
      warnings.push(
        `Model unavailable (${error instanceof Error ? error.message : "error"}) — used the rules engine.`,
      );
      proposal = composeProposal(analysis);
      source = "local";
    }
  }

  const boost = composeBoost(analysis);

  return {
    proposal,
    boost,
    analysis,
    source,
    wordCount: wordCount(proposal),
    warnings,
  };
}

function userMessage(jd: string, analysis: JobAnalysis): string {
  return `Write one Upwork proposal for Asim Ali. Output ONLY the proposal text.

JOB DESCRIPTION:
${jd}

ANALYSIS (follow this):
${JSON.stringify(
  {
    filterWord: analysis.filterWord,
    jobType: analysis.jobType,
    fit: analysis.fit,
    skipReasons: analysis.skipReasons,
    partialNotes: analysis.partialNotes,
    primaryAction: analysis.primaryAction,
    productHint: analysis.productHint,
    industry: analysis.industry,
    mirrorTerms: analysis.mirrorTerms,
    screeningQuestions: analysis.screeningQuestions,
    asksForRate: analysis.asksForRate,
    isLongTerm: analysis.isLongTerm,
    isVague: analysis.isVague,
    budgetWarning: analysis.budgetWarning,
    needSummary: analysis.needSummary,
  },
  null,
  2,
)}

If fit is skip, still write a short honest decline-style proposal only if they insist — actually: write the proposal but keep it honest, and do not fake excluded skills.

Rates: React/Next ${PROFILE.rates.react}; AI ${PROFILE.rates.ai}; audit ${PROFILE.rates.audit}; long-term ${PROFILE.rates.longTerm}.
`;
}

async function generateWithClaude(
  jd: string,
  analysis: JobAnalysis,
  apiKey: string,
): Promise<string> {
  const models = [
    "claude-sonnet-4-5",
    "claude-sonnet-4-20250514",
    "claude-3-5-sonnet-latest",
  ];
  let lastError = "Claude request failed";
  for (const model of models) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 900,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage(jd, analysis) }],
      }),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        content?: { type: string; text?: string }[];
      };
      const text = data.content?.find((c) => c.type === "text")?.text;
      if (text) return stripFences(text);
      lastError = "Claude returned an empty proposal";
      break;
    }
    const body = await res.text();
    lastError = `Claude ${res.status}: ${body.slice(0, 180)}`;
    if (res.status !== 404) break;
  }
  throw new Error(lastError);
}

async function generateWithOpenAI(
  jd: string,
  analysis: JobAnalysis,
  apiKey: string,
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      temperature: 0.4,
      max_tokens: 900,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage(jd, analysis) },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 180)}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty proposal");
  return stripFences(text);
}

function stripFences(text: string): string {
  return text
    .replace(/^```(?:markdown|text)?\n/i, "")
    .replace(/\n```$/i, "")
    .trim();
}
