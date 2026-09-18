import { generateProposal } from "@/lib/generate";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      jobDescription?: string;
      provider?: "auto" | "local" | "claude" | "openai";
      anthropicKey?: string;
      openaiKey?: string;
    };

    const jobDescription = body.jobDescription?.trim() ?? "";
    if (jobDescription.length < 20) {
      return NextResponse.json(
        { error: "Paste the full job description first." },
        { status: 400 },
      );
    }

    const result = await generateProposal(jobDescription, {
      provider: body.provider ?? "auto",
      anthropicKey: body.anthropicKey || process.env.ANTHROPIC_API_KEY,
      openaiKey: body.openaiKey || process.env.OPENAI_API_KEY,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not generate a proposal.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
