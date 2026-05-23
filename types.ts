export type RunType = "morning" | "due_check" | "manual";

export type PickStatus =
  | "watchlist"
  | "active_play"
  | "price_gone"
  | "killed"
  | "pass"
  | "resulted";

export type ConfidenceGrade = "A" | "A-" | "B+" | "B" | "B-" | "C+" | "C" | "C-" | "D";

export type SlateGame = {
  id?: string;
  run_id?: string;
  sport: string;
  league: string;
  away_team: string;
  home_team: string;
  game_time_et: string;
  game_time_utc?: string | null;
  status: "scheduled" | "live" | "final" | "postponed" | "unknown";
  markets_to_watch: string[];
  notes?: string | null;
  next_check_at?: string | null;
  last_checked_at?: string | null;
};

export type BettingPick = {
  id?: string;
  run_id?: string;
  game_id?: string | null;
  sport: string;
  league: string;
  matchup: string;
  bet_type: string;
  pick: string;
  current_line: string;
  best_price_found?: string | null;
  target_price: string;
  kill_price: string;
  status: PickStatus;
  confidence_grade: ConfidenceGrade;
  stake_units: number;
  reason_to_bet: string;
  steelman_against: string;
  line_movement_note?: string | null;
  injury_weather_note?: string | null;
  sources?: string[];
};

export type TweetDraft = {
  id?: string;
  run_id?: string;
  draft_type: "best_bet" | "line_movement" | "clv" | "recap" | "lesson" | "thread";
  tweet_text: string;
};

export type AuditReport = {
  run_type: RunType;
  slate_date: string;
  generated_at_et: string;
  headline: string;
  bankroll_note: string;
  games: SlateGame[];
  picks: BettingPick[];
  tweet_drafts: TweetDraft[];
  sharp_notes: string[];
  sources: string[];
};

export type DashboardData = {
  latestRun: {
    id: string;
    run_type: RunType;
    slate_date: string;
    generated_at: string;
    headline: string;
    bankroll_note: string;
    sharp_notes: string[];
    sources: string[];
  } | null;
  games: SlateGame[];
  picks: BettingPick[];
  tweetDrafts: TweetDraft[];
};
