import { jsonrepair } from "jsonrepair";
import type { AuditReport } from "@/types";
import { getEasternDate, getEasternDateTime } from "./time";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export async function runClaudeAudit(prompt: string): Promise<AuditReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const requestedSearches = Number(process.env.MAX_WEB_SEARCHES_PER_RUN || "1");
  const maxWebSearches = Math.max(0, Math.min(requestedSearches, 1));
  const maxTokens = Math.min(Number(process.env.ANTHROPIC_MAX_TOKENS || "1200"), 1200);
  const timeoutMs = Math.min(Number(process.env.ANTHROPIC_TIMEOUT_MS || "45000"), 45000);

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  if (maxWebSearches > 0) {
    body.tools = [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: maxWebSearches,
      },
    ];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return buildFallbackReport("Claude scan timed out before it could return a report.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const errorText = await response.text();

    if (response.status === 429) {
      return buildFallbackReport("Anthropic rate limit hit. The app is connected, but the Claude account needs a smaller scan or higher API limits before full web research will work.");
    }

    throw new Error(`Anthropic request failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const text = extractText(data);
  return parseAuditJson(text);
}

function extractText(data: any) {
  if (!Array.isArray(data?.content)) {
    throw new Error("Anthropic response did not contain a content array.");
  }

  const joined = data.content
    .filter((block: any) => block?.type === "text")
    .map((block: any) => block.text)
    .join("\n");

  if (!joined.trim()) {
    throw new Error("Anthropic response did not contain usable text.");
  }

  return joined;
}

function parseAuditJson(text: string): AuditReport {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Claude did not return JSON.");
  }

  const jsonText = cleaned.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonText) as AuditReport;
  } catch {
    try {
      return JSON.parse(jsonrepair(jsonText)) as AuditReport;
    } catch (repairError) {
      const message = repairError instanceof Error ? repairError.message : "Unknown JSON repair error";
      throw new Error(`Claude returned malformed JSON and repair failed: ${message}`);
    }
  }
}

function buildFallbackReport(reason: string): AuditReport {
  return {
    run_type: "manual",
    slate_date: getEasternDate(),
    generated_at_et: getEasternDateTime(),
    headline: "Scan blocked by Claude API limit",
    bankroll_note: "No official plays. Do not bet from this failed scan.",
    games: [],
    picks: [
      {
        sport: "SYSTEM",
        league: "SYSTEM",
        matchup: "TheLineAudit API check",
        bet_type: "Status",
        pick: "No bet",
        current_line: "N/A",
        best_price_found: null,
        target_price: "N/A",
        kill_price: "N/A",
        status: "pass",
        confidence_grade: "D",
        stake_units: 0,
        reason_to_bet: "No bet. The scan did not complete.",
        steelman_against: reason,
        line_movement_note: null,
        injury_weather_note: null,
        sources: ["Anthropic API"],
      },
    ],
    tweet_drafts: [
      {
        draft_type: "lesson",
        tweet_text: "Sharp betting rule: no number is worth forcing. If the data feed or research process is broken, pass. Process > action.",
      },
    ],
    sharp_notes: [reason, "The app successfully handled the failure instead of spinning forever."],
    sources: ["Anthropic API"],
  };
}
