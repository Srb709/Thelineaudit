import type { AuditReport, DashboardData, BettingPick, SlateGame, TweetDraft } from "@/types";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { getNextPregameCheck, isoOrNull } from "./time";

export async function saveAuditReport(report: AuditReport) {
  const supabase = getSupabaseAdmin();

  const { data: run, error: runError } = await supabase
    .from("audit_runs")
    .insert({
      run_type: report.run_type,
      slate_date: report.slate_date,
      headline: report.headline,
      bankroll_note: report.bankroll_note,
      sharp_notes: report.sharp_notes || [],
      sources: report.sources || [],
      raw_report: report,
    })
    .select("id")
    .single();

  if (runError || !run) {
    throw new Error(`Failed to save audit run: ${runError?.message || "unknown error"}`);
  }

  const gameIdByMatchup = new Map<string, string>();

  for (const game of report.games || []) {
    const nextCheck = getNextPregameCheck(game.game_time_utc);

    const { data: savedGame, error: gameError } = await supabase
      .from("games")
      .insert({
        run_id: run.id,
        sport: game.sport,
        league: game.league,
        away_team: game.away_team,
        home_team: game.home_team,
        game_time_et: game.game_time_et,
        game_time_utc: game.game_time_utc || null,
        status: game.status || "unknown",
        markets_to_watch: game.markets_to_watch || [],
        notes: game.notes || null,
        last_checked_at: new Date().toISOString(),
        next_check_at: isoOrNull(nextCheck),
      })
      .select("id, away_team, home_team")
      .single();

    if (gameError || !savedGame) {
      throw new Error(`Failed to save game: ${gameError?.message || "unknown error"}`);
    }

    gameIdByMatchup.set(`${savedGame.away_team} @ ${savedGame.home_team}`.toLowerCase(), savedGame.id);
  }

  const savedPickIdByIndex: string[] = [];

  for (const pick of report.picks || []) {
    const normalizedMatchup = pick.matchup.toLowerCase();
    const matchingGameId = gameIdByMatchup.get(normalizedMatchup) || null;

    const { data: savedPick, error: pickError } = await supabase
      .from("picks")
      .insert({
        run_id: run.id,
        game_id: matchingGameId,
        sport: pick.sport,
        league: pick.league,
        matchup: pick.matchup,
        bet_type: pick.bet_type,
        pick: pick.pick,
        current_line: pick.current_line,
        best_price_found: pick.best_price_found || null,
        target_price: pick.target_price,
        kill_price: pick.kill_price,
        status: pick.status,
        confidence_grade: pick.confidence_grade,
        stake_units: pick.stake_units,
        reason_to_bet: pick.reason_to_bet,
        steelman_against: pick.steelman_against,
        line_movement_note: pick.line_movement_note || null,
        injury_weather_note: pick.injury_weather_note || null,
        sources: pick.sources || [],
      })
      .select("id")
      .single();

    if (pickError || !savedPick) {
      throw new Error(`Failed to save pick: ${pickError?.message || "unknown error"}`);
    }

    savedPickIdByIndex.push(savedPick.id);

    if (pick.current_line || pick.best_price_found) {
      await supabase.from("line_snapshots").insert({
        game_id: matchingGameId,
        pick_id: savedPick.id,
        market: pick.bet_type,
        line_value: pick.current_line,
        price: pick.best_price_found || pick.current_line,
        book_or_source: "Claude web search",
      });
    }
  }

  for (const draft of report.tweet_drafts || []) {
    const { error: tweetError } = await supabase.from("tweet_drafts").insert({
      run_id: run.id,
      draft_type: draft.draft_type,
      tweet_text: draft.tweet_text,
    });

    if (tweetError) {
      throw new Error(`Failed to save tweet draft: ${tweetError.message}`);
    }
  }

  return run.id as string;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseAdmin();

  const { data: latestRun, error: runError } = await supabase
    .from("audit_runs")
    .select("id, run_type, slate_date, generated_at, headline, bankroll_note, sharp_notes, sources")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (runError) {
    throw new Error(`Failed to load latest run: ${runError.message}`);
  }

  if (!latestRun) {
    return {
      latestRun: null,
      games: [],
      picks: [],
      tweetDrafts: [],
    };
  }

  const [{ data: games, error: gamesError }, { data: picks, error: picksError }, { data: tweetDrafts, error: tweetsError }] = await Promise.all([
    supabase.from("games").select("*").eq("run_id", latestRun.id).order("game_time_utc", { ascending: true }),
    supabase.from("picks").select("*").eq("run_id", latestRun.id).order("stake_units", { ascending: false }),
    supabase.from("tweet_drafts").select("*").eq("run_id", latestRun.id).order("created_at", { ascending: true }),
  ]);

  if (gamesError) throw new Error(`Failed to load games: ${gamesError.message}`);
  if (picksError) throw new Error(`Failed to load picks: ${picksError.message}`);
  if (tweetsError) throw new Error(`Failed to load tweets: ${tweetsError.message}`);

  return {
    latestRun: latestRun as DashboardData["latestRun"],
    games: (games || []) as SlateGame[],
    picks: (picks || []) as BettingPick[],
    tweetDrafts: (tweetDrafts || []) as TweetDraft[],
  };
}

export async function getDueGames() {
  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("games")
    .select("id, league, away_team, home_team, game_time_et, game_time_utc, notes")
    .not("next_check_at", "is", null)
    .lte("next_check_at", now)
    .in("status", ["scheduled", "unknown"])
    .order("next_check_at", { ascending: true })
    .limit(8);

  if (error) {
    throw new Error(`Failed to load due games: ${error.message}`);
  }

  return data || [];
}

export async function markDueGamesChecked(gameIds: string[]) {
  if (!gameIds.length) return;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("games")
    .update({ next_check_at: null, last_checked_at: new Date().toISOString() })
    .in("id", gameIds);

  if (error) {
    throw new Error(`Failed to mark due games checked: ${error.message}`);
  }
}
