"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { JobAnalysis } from "@/lib/analyze-job";
import {
  generateProposal,
  type GenerateResult,
} from "@/lib/generate";
import { SAMPLE_JOBS } from "@/lib/samples";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  ClipboardPaste,
  Copy,
  Loader2,
  Settings2,
  Sparkles,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type Provider = "auto" | "local" | "claude" | "openai";

type Settings = {
  provider: Provider;
  anthropicKey: string;
  openaiKey: string;
};

const SETTINGS_KEY = "asim-proposal-studio-settings";

const DEFAULT_SETTINGS: Settings = {
  provider: "local",
  anthropicKey: "",
  openaiKey: "",
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function ProposalRichText({ text }: { text: string }) {
  const chunks = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <div className="font-serif text-[1.05rem] leading-7 text-foreground/95 whitespace-pre-wrap">
      {chunks.map((chunk, i) =>
        chunk.startsWith("**") && chunk.endsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">
            {chunk.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{chunk}</span>
        ),
      )}
    </div>
  );
}

function FitBadge({ fit }: { fit: JobAnalysis["fit"] }) {
  if (fit === "strong") {
    return (
      <Badge className="bg-emerald-700/20 text-emerald-300 border-emerald-700/40">
        Strong fit — apply
      </Badge>
    );
  }
  if (fit === "partial") {
    return (
      <Badge
        variant="outline"
        className="border-amber-700/50 bg-amber-900/20 text-amber-200"
      >
        Partial fit — stay honest
      </Badge>
    );
  }
  return (
    <Badge variant="destructive">Do not apply</Badge>
  );
}

function jobTypeLabel(type: JobAnalysis["jobType"]): string {
  const labels: Record<JobAnalysis["jobType"], string> = {
    frontend: "React / Next.js",
    "ai-agent": "AI agents / RAG",
    "field-service": "Field service",
    "real-estate": "Real estate / PropTech",
    "saas-dashboard": "SaaS dashboard",
    "multi-tenant": "Multi-tenant / RBAC",
    supabase: "Supabase",
    automation: "n8n / automation",
    audit: "Technical audit",
    "fullstack-mvp": "Full-stack MVP",
    vague: "Vague post",
  };
  return labels[type];
}

export function ProposalStudio() {
  const [job, setJob] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<"proposal" | "boost" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<Settings>(DEFAULT_SETTINGS);

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsDraft));
    setSettingsOpen(false);
    toast.success("Settings saved on this device");
  };

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    const current = loadSettings();
    try {
      const useLocal =
        current.provider === "local" ||
        (current.provider === "auto" &&
          !current.anthropicKey &&
          !current.openaiKey);

      if (useLocal) {
        const next = await generateProposal(job, { provider: "local" });
        setResult(next);
      } else {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            jobDescription: job,
            provider: current.provider,
            anthropicKey: current.anthropicKey || undefined,
            openaiKey: current.openaiKey || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Generate failed");
        setResult(data as GenerateResult);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setLoading(false);
    }
  }, [job]);

  const copy = async (text: string, which: "proposal" | "boost") => {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    toast.success(which === "proposal" ? "Proposal copied" : "Boost message copied");
    setTimeout(() => setCopied(null), 1600);
  };

  const loadSample = (id: string) => {
    const sample = SAMPLE_JOBS.find((s) => s.id === id);
    if (!sample) return;
    setJob(sample.text);
    setResult(null);
    setError(null);
  };

  const sourceLabel = useMemo(() => {
    if (!result) return null;
    if (result.source === "local") return "Rules engine";
    if (result.source === "claude") return "Claude";
    return "OpenAI";
  }, [result]);

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em] text-primary/80">
              Asim Ali · Bid desk
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl tracking-tight text-foreground">
              Proposal Studio
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Paste a job. Get a short proposal that follows your rules — no
              clarifying questions.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden md:flex flex-col items-end text-right mr-2">
              <span className="text-xs text-muted-foreground">
                Top Rated Plus · 100% JSS · $90K+
              </span>
              <span className="text-xs text-muted-foreground/80">
                7+ years · Lahore (PKT)
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSettingsDraft(loadSettings());
                setSettingsOpen(true);
              }}
            >
              <Settings2 />
              API keys
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-0 lg:grid-cols-2">
        <section className="flex flex-col border-b lg:border-b-0 lg:border-r border-border/80 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <Label htmlFor="job" className="text-sm font-medium">
              Job description
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_JOBS.map((sample) => (
                <Button
                  key={sample.id}
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => loadSample(sample.id)}
                >
                  {sample.label}
                </Button>
              ))}
            </div>
          </div>
          <Textarea
            id="job"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            placeholder="Paste the full Upwork post here — including any “start with the word…” filter."
            className="min-h-[280px] flex-1 resize-none bg-card/40 text-sm leading-6 md:min-h-[420px]"
          />
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              size="lg"
              className="w-full sm:w-auto"
              onClick={generate}
              disabled={loading || job.trim().length < 20}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Write proposal
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              onClick={async () => {
                try {
                  const text = await navigator.clipboard.readText();
                  if (text.trim().length > 10) {
                    setJob(text);
                    toast.success("Pasted from clipboard");
                  } else {
                    toast.error("Clipboard is empty");
                  }
                } catch {
                  toast.error("Clipboard access was blocked — paste with Ctrl+V");
                }
              }}
            >
              <ClipboardPaste />
              Paste
            </Button>
            <p className="text-xs text-muted-foreground sm:ml-auto">
              {job.trim() ? `${job.trim().split(/\s+/).length} words in the post` : "Waiting for a job post"}
            </p>
          </div>
          {error ? (
            <p className="mt-3 text-sm text-destructive">{error}</p>
          ) : null}
        </section>

        <section className="flex flex-col p-4 sm:p-6 min-h-[520px]">
          {!result ? (
            <EmptyState />
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <FitBadge fit={result.analysis.fit} />
                <Badge variant="outline">{jobTypeLabel(result.analysis.jobType)}</Badge>
                <Badge variant="secondary">{result.wordCount} words</Badge>
                <Badge variant="ghost">{sourceLabel}</Badge>
                {result.analysis.filterWord ? (
                  <Badge variant="outline">
                    Filter: {result.analysis.filterWord}
                  </Badge>
                ) : null}
              </div>

              {result.analysis.fit === "skip" ? (
                <div className="mb-4 flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-medium">Skip this job.</p>
                    <p>
                      {result.analysis.skipReasons.join(" ") ||
                        "Required stack is outside the offer."}{" "}
                      Do not send a proposal that fakes the skill.
                    </p>
                  </div>
                </div>
              ) : null}

              {result.warnings
                .filter((w) => !w.startsWith("Do not apply"))
                .map((warning) => (
                  <p
                    key={warning}
                    className="mb-2 text-xs text-muted-foreground"
                  >
                    {warning}
                  </p>
                ))}

              <Tabs defaultValue="proposal">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <TabsList>
                    <TabsTrigger value="proposal">Proposal</TabsTrigger>
                    <TabsTrigger value="boost">Boost</TabsTrigger>
                    <TabsTrigger value="fit">Fit notes</TabsTrigger>
                  </TabsList>
                  <div className="flex gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copy(result.proposal, "proposal")}
                    >
                      {copied === "proposal" ? <Check /> : <Copy />}
                      Copy proposal
                    </Button>
                  </div>
                </div>

                <TabsContent value="proposal" className="mt-4">
                  <div
                    className={cn(
                      "rounded-xl border border-border/80 bg-card/50 p-4 sm:p-5",
                      result.wordCount > 300 && "ring-1 ring-amber-700/40",
                    )}
                  >
                    {result.wordCount > 300 ? (
                      <p className="mb-3 text-xs text-amber-200">
                        Over 300 words — trim before sending if you can.
                      </p>
                    ) : null}
                    <ProposalRichText text={result.proposal} />
                  </div>
                </TabsContent>

                <TabsContent value="boost" className="mt-4 space-y-3">
                  <div className="rounded-xl border border-border/80 bg-card/50 p-4 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Subject
                      </p>
                      <p className="font-medium">{result.boost.subject}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                        Message
                      </p>
                      <p className="text-sm leading-6">{result.boost.message}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copy(
                          `${result.boost.subject}\n\n${result.boost.message}`,
                          "boost",
                        )
                      }
                    >
                      {copied === "boost" ? <Check /> : <Copy />}
                      Copy boost
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="fit" className="mt-4">
                  <FitNotes analysis={result.analysis} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </section>
      </main>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Optional model keys</DialogTitle>
            <DialogDescription>
              The rules engine works with no key. Add Claude or OpenAI only if
              you want a second pass in your voice. Keys stay in this browser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="provider">Writer</Label>
              <select
                id="provider"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                value={settingsDraft.provider}
                onChange={(e) =>
                  setSettingsDraft((s) => ({
                    ...s,
                    provider: e.target.value as Provider,
                  }))
                }
              >
                <option value="local">Rules engine only (no API)</option>
                <option value="auto">Auto (Claude, then OpenAI, then rules)</option>
                <option value="claude">Claude</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="anthropic">Anthropic API key</Label>
              <Input
                id="anthropic"
                type="password"
                autoComplete="off"
                value={settingsDraft.anthropicKey}
                onChange={(e) =>
                  setSettingsDraft((s) => ({
                    ...s,
                    anthropicKey: e.target.value,
                  }))
                }
                placeholder="sk-ant-…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="openai">OpenAI API key</Label>
              <Input
                id="openai"
                type="password"
                autoComplete="off"
                value={settingsDraft.openaiKey}
                onChange={(e) =>
                  setSettingsDraft((s) => ({
                    ...s,
                    openaiKey: e.target.value,
                  }))
                }
                placeholder="sk-…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-start justify-center rounded-xl border border-dashed border-border/80 bg-card/20 px-6 py-16">
      <p className="font-serif text-2xl text-foreground">No proposal yet</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Paste the Upwork post on the left — including hidden filter words like
        “start with RADIOLOGY”. The writer mirrors the job, picks the right live
        links, answers screening questions, and stops at ~300 words.
      </p>
      <p className="mt-4 text-xs text-muted-foreground">
        Try a sample job to see the format before you paste a real one.
      </p>
    </div>
  );
}

function FitNotes({ analysis }: { analysis: JobAnalysis }) {
  return (
    <div className="space-y-4 rounded-xl border border-border/80 bg-card/50 p-4 text-sm">
      <Row label="Job type" value={jobTypeLabel(analysis.jobType)} />
      <Row label="Action" value={analysis.primaryAction} />
      <Row label="Product" value={analysis.productHint} />
      {analysis.industry ? <Row label="Industry" value={analysis.industry} /> : null}
      {analysis.mirrorTerms.length ? (
        <Row label="Mirrored language" value={analysis.mirrorTerms.join(", ")} />
      ) : null}
      {analysis.fitReasons.length ? (
        <Row label="Why it fits" value={analysis.fitReasons.join(" · ")} />
      ) : null}
      {analysis.partialNotes.length ? (
        <Row label="Honest gaps" value={analysis.partialNotes.join(" ")} />
      ) : null}
      {analysis.skipReasons.length ? (
        <Row label="Skip reasons" value={analysis.skipReasons.join(" ")} />
      ) : null}
      {analysis.screeningQuestions.length ? (
        <Row
          label="Screening Qs"
          value={analysis.screeningQuestions.map((q) => q.raw).join(" | ")}
        />
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 leading-6">{value}</p>
    </div>
  );
}
