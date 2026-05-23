import { NextRequest, NextResponse } from "next/server";
import { requireRouteSecret } from "@/lib/auth";
import { runClaudeAudit } from "@/lib/anthropic";
import { buildDueCheckPrompt } from "@/lib/prompts";
import { getDueGames, markDueGamesChecked, saveAuditReport } from "@/lib/database";

export const runtime = "nodejs";
export const maxDuration = 300;

async function handleDueAudit(request: NextRequest) {
  const guard = requireRouteSecret(request);
  if (guard) return guard;

  try {
    const games = await getDueGames();

    if (!games.length) {
      return NextResponse.json({ ok: true, message: "No games due for a check right now.", checked: 0 });
    }

    const report = await runClaudeAudit(buildDueCheckPrompt(games));
    const runId = await saveAuditReport(report);
    await markDueGamesChecked(games.map((game) => game.id));

    return NextResponse.json({
      ok: true,
      runId,
      checked: games.length,
      headline: report.headline,
      picks: report.picks?.length || 0,
      tweets: report.tweet_drafts?.length || 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Due audit failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleDueAudit(request);
}

export async function POST(request: NextRequest) {
  return handleDueAudit(request);
}
