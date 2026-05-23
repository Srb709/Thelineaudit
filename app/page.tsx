"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardData, BettingPick, TweetDraft } from "@/types";

type Tab = "picks" | "games" | "tweets" | "notes";

export default function HomePage() {
  const [secret, setSecret] = useState("");
  const [savedSecret, setSavedSecret] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [tab, setTab] = useState<Tab>("picks");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<"morning" | "manual" | "due" | null>(null);
  const [error, setError] = useState("");
  const [manualContext, setManualContext] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("lineaudit-secret") || "";
    if (stored) {
      setSavedSecret(stored);
      setSecret(stored);
      loadDashboard(stored);
    }
  }, []);

  async function loadDashboard(key = savedSecret) {
    if (!key) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/dashboard?secret=${encodeURIComponent(key)}`, {
        cache: "no-store",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || "Dashboard failed to load.");
      }

      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dashboard failed to load.");
    } finally {
      setLoading(false);
    }
  }

  async function savePassword() {
    window.localStorage.setItem("lineaudit-secret", secret);
    setSavedSecret(secret);
    await loadDashboard(secret);
  }

  async function triggerAudit(kind: "morning" | "manual" | "due") {
    if (!savedSecret) return;
    setRunning(kind);
    setError("");

    const endpoint = kind === "morning" ? "/api/morning" : kind === "manual" ? "/api/manual" : "/api/due";
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 75_000);

    try {
      const response = await fetch(`${endpoint}?secret=${encodeURIComponent(savedSecret)}`, {
        method: kind === "manual" ? "POST" : "GET",
        signal: controller.signal,
        headers: { "content-type": "application/json" },
        body: kind === "manual" ? JSON.stringify({ context: manualContext }) : undefined,
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(json?.error || "Audit failed before it could save a report.");
      }

      await loadDashboard(savedSecret);
    } catch (err) {
      const message = err instanceof Error && err.name === "AbortError"
        ? "Scan timed out in the browser. The button has been reset. Try Manual Refresh with a narrower question or wait 60 seconds and reload."
        : err instanceof Error
          ? err.message
          : "Audit failed.";
      setError(message);
    } finally {
      window.clearTimeout(timeout);
      setRunning(null);
    }
  }

  const metrics = useMemo(() => {
    const picks = data?.picks || [];
    const active = picks.filter((pick) => pick.status === "active_play").length;
    const watchlist = picks.filter((pick) => pick.status === "watchlist").length;
    const totalUnits = picks.reduce((sum, pick) => sum + Number(pick.stake_units || 0), 0);

    return { active, watchlist, totalUnits: totalUnits.toFixed(2), tweets: data?.tweetDrafts?.length || 0 };
  }, [data]);

  if (!savedSecret) {
    return (
      <main className="login">
        <section className="card login-card">
          <div className="brand-mark" />
          <div style={{ height: 16 }} />
          <h1>TheLineAudit</h1>
          <p className="sub">Private mobile betting desk. Enter your dashboard password.</p>
          <input
            className="input"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            type="password"
            placeholder="Dashboard password"
          />
          <button className="btn" onClick={savePassword} disabled={!secret.trim()}>
            Unlock Desk
          </button>
          <p className="small" style={{ marginTop: 12 }}>
            This password is stored only on this phone in Safari local storage. It is used to call your private app routes.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="safe-shell">
      <header className="header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="brand-mark" />
          <div>
            <h1>TheLineAudit</h1>
            <p className="sub">Sharp AI betting desk • @TheLineAudit</p>
          </div>
        </div>
        <button
          className="status-pill"
          onClick={() => {
            window.localStorage.removeItem("lineaudit-secret");
            setSavedSecret("");
            setData(null);
          }}
        >
          Lock
        </button>
      </header>

      <section className="card">
        <p className="sub">Latest audit</p>
        <h2 style={{ marginTop: 4, fontSize: 21, letterSpacing: "-0.04em" }}>
          {data?.latestRun?.headline || "No slate audit saved yet."}
        </h2>
        <p className="small" style={{ marginTop: 8 }}>
          {data?.latestRun?.bankroll_note || "Run a morning scan to load the first board."}
        </p>

        <div className="grid-2" style={{ marginTop: 14 }}>
          <div className="metric">
            <strong>{metrics.active}</strong>
            <span>Active plays</span>
          </div>
          <div className="metric">
            <strong>{metrics.watchlist}</strong>
            <span>Watchlist</span>
          </div>
          <div className="metric">
            <strong>{metrics.totalUnits}u</strong>
            <span>Total risk</span>
          </div>
          <div className="metric">
            <strong>{metrics.tweets}</strong>
            <span>Tweet drafts</span>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="button-row">
          <button className="btn" onClick={() => triggerAudit("morning")} disabled={!!running}>
            {running === "morning" ? "Scanning..." : "Morning Scan"}
          </button>
          <button className="btn secondary" onClick={() => triggerAudit("due")} disabled={!!running}>
            {running === "due" ? "Checking..." : "Due Checks"}
          </button>
        </div>

        <textarea
          className="copy-box"
          style={{ minHeight: 74 }}
          placeholder="Optional manual note, example: include my current lines from FanDuel or challenge Claude's card."
          value={manualContext}
          onChange={(event) => setManualContext(event.target.value)}
        />
        <button className="btn secondary" style={{ width: "100%", marginTop: 10 }} onClick={() => triggerAudit("manual")} disabled={!!running}>
          {running === "manual" ? "Refreshing..." : "Manual Refresh"}
        </button>
        <button className="tab" style={{ width: "100%", marginTop: 10 }} onClick={() => loadDashboard(savedSecret)} disabled={loading || !!running}>
          {loading ? "Loading..." : "Reload Dashboard"}
        </button>
        {error ? <p className="small" style={{ color: "#ff7272", marginTop: 10 }}>{error}</p> : null}
      </section>

      <nav className="tabs">
        <button className={`tab ${tab === "picks" ? "active" : ""}`} onClick={() => setTab("picks")}>Best Bets</button>
        <button className={`tab ${tab === "games" ? "active" : ""}`} onClick={() => setTab("games")}>Slate</button>
        <button className={`tab ${tab === "tweets" ? "active" : ""}`} onClick={() => setTab("tweets")}>Tweets</button>
        <button className={`tab ${tab === "notes" ? "active" : ""}`} onClick={() => setTab("notes")}>Sharp Notes</button>
      </nav>

      {tab === "picks" ? <Picks picks={data?.picks || []} /> : null}
      {tab === "games" ? <Games games={data?.games || []} /> : null}
      {tab === "tweets" ? <Tweets drafts={data?.tweetDrafts || []} /> : null}
      {tab === "notes" ? <Notes notes={data?.latestRun?.sharp_notes || []} sources={data?.latestRun?.sources || []} /> : null}
    </main>
  );
}

function Picks({ picks }: { picks: BettingPick[] }) {
  if (!picks.length) return <Empty text="No picks yet. Run the morning scan." />;

  return (
    <>
      {picks.map((pick) => (
        <section className="card pick" key={pick.id || `${pick.matchup}-${pick.pick}`}>
          <div className="pick-head">
            <div>
              <p className="sub">{pick.matchup} • {pick.bet_type}</p>
              <h2 className="pick-title">{pick.pick}</h2>
            </div>
            <StatusBadge status={pick.status} />
          </div>
          <div className="kv">
            <div><span>Line</span><strong>{pick.current_line}</strong></div>
            <div><span>Target</span><strong>{pick.target_price}</strong></div>
            <div><span>Kill</span><strong>{pick.kill_price}</strong></div>
            <div><span>Grade</span><strong>{pick.confidence_grade}</strong></div>
            <div><span>Stake</span><strong>{pick.stake_units}u</strong></div>
            <div><span>League</span><strong>{pick.league}</strong></div>
          </div>
          <p className="small"><strong style={{ color: "var(--green)" }}>Why:</strong> {pick.reason_to_bet}</p>
          <p className="small"><strong style={{ color: "var(--amber)" }}>Pushback:</strong> {pick.steelman_against}</p>
          {pick.line_movement_note ? <p className="small">Line: {pick.line_movement_note}</p> : null}
          {pick.injury_weather_note ? <p className="small">News: {pick.injury_weather_note}</p> : null}
        </section>
      ))}
    </>
  );
}

function Games({ games }: { games: DashboardData["games"] }) {
  if (!games.length) return <Empty text="No games saved yet." />;

  return (
    <>
      {games.map((game) => (
        <section className="card" key={game.id || `${game.away_team}-${game.home_team}`}>
          <p className="sub">{game.league} • {game.game_time_et}</p>
          <h2 className="pick-title">{game.away_team} @ {game.home_team}</h2>
          <p className="small" style={{ marginTop: 8 }}>{game.notes || "No note."}</p>
          <hr />
          <p className="small">Markets: {(game.markets_to_watch || []).join(", ") || "None listed"}</p>
          <p className="small">Next check: {game.next_check_at ? new Date(game.next_check_at).toLocaleString() : "Not scheduled"}</p>
        </section>
      ))}
    </>
  );
}

function Tweets({ drafts }: { drafts: TweetDraft[] }) {
  if (!drafts.length) return <Empty text="No tweet drafts yet." />;

  return (
    <>
      {drafts.map((draft) => (
        <section className="card" key={draft.id || draft.tweet_text.slice(0, 20)}>
          <p className="sub">{draft.draft_type.replaceAll("_", " ")}</p>
          <textarea className="copy-box" readOnly value={draft.tweet_text} />
          <button className="btn" style={{ width: "100%", marginTop: 10 }} onClick={() => navigator.clipboard.writeText(draft.tweet_text)}>
            Copy Tweet
          </button>
        </section>
      ))}
    </>
  );
}

function Notes({ notes, sources }: { notes: string[]; sources: string[] }) {
  return (
    <section className="card">
      <h2 className="pick-title">Sharp Notes</h2>
      {notes.length ? notes.map((note) => <p className="small" style={{ marginTop: 10 }} key={note}>• {note}</p>) : <p className="empty">No notes yet.</p>}
      <hr />
      <h3 style={{ fontSize: 15 }}>Sources</h3>
      {sources.length ? sources.map((source) => <p className="small" style={{ marginTop: 8 }} key={source}>{source}</p>) : <p className="small" style={{ marginTop: 8 }}>No sources saved yet.</p>}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "active_play" ? "green" : status === "watchlist" || status === "price_gone" ? "amber" : "red";
  return <span className={`badge ${color}`}>{status.replaceAll("_", " ")}</span>;
}

function Empty({ text }: { text: string }) {
  return <section className="card empty">{text}</section>;
}
