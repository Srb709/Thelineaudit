const SUPABASE_URL = "https://jghdunallqvaejbfhouz.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXAiLCJyZWYiOiJqZ2hkdW5hbGxxdmFlamJmaG91eiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg4NDY4MjM2LCJleHAiOjIxMDQwNDQyMzZ9.fZncGcVwEo1Ipaz1802_Ac85Xr9YQeLvPBiaEn50QIU";

export type PublicBet = {
  id: string;
  x_post_id: string | null;
  sport: string;
  league: string | null;
  bet_type: string;
  selection: string;
  matchup: string | null;
  market: string | null;
  line: number | null;
  american_odds: number;
  target_profit_units: number;
  risk_units: number;
  event_date: string | null;
  status: "pending" | "win" | "loss" | "push" | "void";
  net_units: number | null;
  final_score: string | null;
  grading_stat_label: string | null;
  grading_stat_value: string | null;
  grading_source: string | null;
  graded_at: string | null;
  created_at: string;
  post_url: string | null;
  post_text: string | null;
  posted_at: string | null;
  impressions: number | null;
  likes: number | null;
  replies: number | null;
  reposts: number | null;
  quote_posts: number | null;
};

export type RoiRow = {
  sport: string;
  settled_bets: number;
  total_risk_units: number;
  net_units: number;
  roi_pct: number | null;
};

async function rpc<T>(name: string): Promise<T> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: "{}",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Tracker data request failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

export async function getPublicBets() {
  return rpc<PublicBet[]>("get_public_bets");
}

export async function getRoiSummary() {
  return rpc<RoiRow[]>("get_roi_summary");
}

export function formatOdds(odds: number) {
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function formatUnits(units: number | null) {
  if (units == null) return "—";
  return `${units > 0 ? "+" : ""}${Number(units).toFixed(2)}u`;
}

export function formatRoi(roi: number | null) {
  if (roi == null) return "—";
  return `${roi > 0 ? "+" : ""}${Number(roi).toFixed(2)}%`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Date pending";
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00-04:00`) : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(date);
}
