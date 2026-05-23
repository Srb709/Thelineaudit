import { getEasternDate, getEasternDateTime } from "./time";

const schema = `Return JSON only:
{"run_type":"morning|due_check|manual","slate_date":"YYYY-MM-DD","generated_at_et":"string","headline":"string","bankroll_note":"string","games":[{"sport":"MLB","league":"MLB","away_team":"string","home_team":"string","game_time_et":"string","game_time_utc":"ISO or null","status":"scheduled|live|final|postponed|unknown","markets_to_watch":["ML","F5","Ks"],"notes":"string","next_check_at":null,"last_checked_at":null}],"picks":[{"sport":"MLB","league":"MLB","matchup":"Away @ Home","bet_type":"ML|Spread|Total|F5|NRFI|Prop|Other","pick":"string","current_line":"string","best_price_found":"string or null","target_price":"string","kill_price":"string","status":"watchlist|active_play|price_gone|killed|pass|resulted","confidence_grade":"A|A-|B+|B|B-|C+|C|C-|D","stake_units":0.5,"reason_to_bet":"string","steelman_against":"string","line_movement_note":"string or null","injury_weather_note":"string or null","sources":["source"]}],"tweet_drafts":[{"draft_type":"best_bet|line_movement|clv|recap|lesson|thread","tweet_text":"string"}],"sharp_notes":["string"],"sources":["source"]}`;

const rules = `You are TheLineAudit, a sharp betting research desk. No locks, no parlays as official plays, no forced bets. Give target price, kill price, stake, grade, reason, and strongest counterargument. If price is gone, mark price_gone/pass. MLB priority: starters, bullpen, lineup, handedness, park/weather, market price. Tweets must sound sharp and non-scammy. Unit default: 1u=$10.`;

export function buildMorningPrompt() {
  return `${rules}
Date ET: ${getEasternDate()}. Time ET: ${getEasternDateTime()}.
Run a lean morning slate audit. MLB first; NBA/NHL only if major playoff/market games exist. Use web search for current slate, odds, probable pitchers, injuries/lineups, weather/roof, props, and notable movement. Return max 4 picks/watchlist plays and 5 tweet drafts. ${schema}`;
}

export function buildManualPrompt(userContext?: string) {
  return `${rules}
Date ET: ${getEasternDate()}. Time ET: ${getEasternDateTime()}.
Manual refresh context: ${userContext || "none"}
Recheck current numbers/news. Update play/pass status. Return max 4 picks/watchlist plays and 5 tweet drafts. ${schema}`;
}

export function buildDueCheckPrompt(games: Array<{ away_team: string; home_team: string; game_time_et: string; league: string; notes?: string | null }>) {
  const gameList = games
    .map((game) => `${game.league}: ${game.away_team} @ ${game.home_team}, ${game.game_time_et}. ${game.notes || ""}`)
    .join("\n");

  return `${rules}
Pregame due-check only for:\n${gameList}
Time ET: ${getEasternDateTime()}.
Check current line/news/weather/lineup/market movement. Be strict: active_play, watchlist, price_gone, killed, or pass. Return max 4 picks and 4 tweets. ${schema}`;
}
