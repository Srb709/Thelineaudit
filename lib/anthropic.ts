import type { AuditReport } from "@/types";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

export async function runClaudeAudit(prompt: string): Promise<AuditReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
  const maxWebSearches = Number(process.env.MAX_WEB_SEARCHES_PER_RUN || "8");
  const maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS || "3500");

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.2,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: maxWebSearches,
        },
      ],
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
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
  return JSON.parse(jsonText) as AuditReport;
}
