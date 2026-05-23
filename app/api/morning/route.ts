import { NextRequest, NextResponse } from "next/server";
import { requireRouteSecret } from "@/lib/auth";
import { runClaudeAudit } from "@/lib/anthropic";
import { buildMorningPrompt } from "@/lib/prompts";
import { saveAuditReport } from "@/lib/database";

export const runtime = "nodejs";
export const maxDuration = 300;

async function handleMorningAudit(request: NextRequest) {
  const guard = requireRouteSecret(request);
  if (guard) return guard;

  try {
    const report = await runClaudeAudit(buildMorningPrompt());
    const runId = await saveAuditReport(report);

    return NextResponse.json({
      ok: true,
      runId,
      headline: report.headline,
      picks: report.picks?.length || 0,
      tweets: report.tweet_drafts?.length || 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Morning audit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleMorningAudit(request);
}

export async function POST(request: NextRequest) {
  return handleMorningAudit(request);
}
