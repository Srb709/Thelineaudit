create extension if not exists pgcrypto;

create table if not exists audit_runs (
  id uuid primary key default gen_random_uuid(),
  run_type text not null check (run_type in ('morning', 'due_check', 'manual')),
  slate_date date not null,
  generated_at timestamptz not null default now(),
  headline text not null default '',
  bankroll_note text not null default '',
  sharp_notes text[] not null default '{}',
  sources text[] not null default '{}',
  raw_report jsonb not null default '{}'::jsonb
);

create index if not exists audit_runs_slate_date_idx on audit_runs (slate_date desc);
create index if not exists audit_runs_generated_at_idx on audit_runs (generated_at desc);

create table if not exists games (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references audit_runs(id) on delete cascade,
  sport text not null,
  league text not null,
  away_team text not null,
  home_team text not null,
  game_time_et text not null,
  game_time_utc timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'final', 'postponed', 'unknown')),
  markets_to_watch text[] not null default '{}',
  notes text,
  last_checked_at timestamptz,
  next_check_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists games_game_time_utc_idx on games (game_time_utc);
create index if not exists games_next_check_at_idx on games (next_check_at);
create index if not exists games_run_id_idx on games (run_id);

create table if not exists picks (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references audit_runs(id) on delete cascade,
  game_id uuid references games(id) on delete set null,
  sport text not null,
  league text not null,
  matchup text not null,
  bet_type text not null,
  pick text not null,
  current_line text not null,
  best_price_found text,
  target_price text not null,
  kill_price text not null,
  status text not null check (status in ('watchlist', 'active_play', 'price_gone', 'killed', 'pass', 'resulted')),
  confidence_grade text not null,
  stake_units numeric(5,2) not null default 0,
  reason_to_bet text not null,
  steelman_against text not null,
  line_movement_note text,
  injury_weather_note text,
  sources text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists picks_run_id_idx on picks (run_id);
create index if not exists picks_status_idx on picks (status);
create index if not exists picks_created_at_idx on picks (created_at desc);

create table if not exists line_snapshots (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade,
  pick_id uuid references picks(id) on delete cascade,
  market text not null,
  line_value text not null,
  price text not null,
  book_or_source text,
  captured_at timestamptz not null default now()
);

create index if not exists line_snapshots_game_id_idx on line_snapshots (game_id);
create index if not exists line_snapshots_pick_id_idx on line_snapshots (pick_id);
create index if not exists line_snapshots_captured_at_idx on line_snapshots (captured_at desc);

create table if not exists tweet_drafts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references audit_runs(id) on delete cascade,
  pick_id uuid references picks(id) on delete set null,
  draft_type text not null check (draft_type in ('best_bet', 'line_movement', 'clv', 'recap', 'lesson', 'thread')),
  tweet_text text not null,
  copied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tweet_drafts_run_id_idx on tweet_drafts (run_id);
create index if not exists tweet_drafts_created_at_idx on tweet_drafts (created_at desc);

alter table audit_runs enable row level security;
alter table games enable row level security;
alter table picks enable row level security;
alter table line_snapshots enable row level security;
alter table tweet_drafts enable row level security;

drop policy if exists "Service role can manage audit_runs" on audit_runs;
create policy "Service role can manage audit_runs" on audit_runs
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage games" on games;
create policy "Service role can manage games" on games
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage picks" on picks;
create policy "Service role can manage picks" on picks
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage line_snapshots" on line_snapshots;
create policy "Service role can manage line_snapshots" on line_snapshots
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "Service role can manage tweet_drafts" on tweet_drafts;
create policy "Service role can manage tweet_drafts" on tweet_drafts
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
