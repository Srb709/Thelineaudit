import { NextRequest, NextResponse } from "next/server";
import { requireRouteSecret } from "@/lib/auth";
import { runClaudeAudit } from "@/lib/anthropic";
import { buildManualPrompt } from "@/lib/prompts";
import { saveAuditReport } from "@/lib/database";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const guard = requireRouteSecret(request);
  if (guard) return guard;

  try {
    const body = await request.json().catch(() => ({}));
    const report = await runClaudeAudit(buildManualPrompt(body?.context));
    const runId = await saveAuditReport(report);

    return NextResponse.json({
      ok: true,
      runId,
      headline: report.headline,
      picks: report.picks?.length || 0,
      tweets: report.tweet_drafts?.length || 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Manual refresh failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
