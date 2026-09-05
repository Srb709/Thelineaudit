import { BetRow } from "./components";
import { formatRoi, formatUnits, getPublicBets, getRoiSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [bets, roiRows] = await Promise.all([getPublicBets(), getRoiSummary()]);
  const open = bets.filter((bet) => bet.status === "pending");
  const recent = bets.filter((bet) => bet.status !== "pending").slice(0, 3);
  const allTime = roiRows.find((row) => row.sport === "ALL_TIME");

  return (
    <main>
      <section className="hero">
        <span className="eyebrow">TODAY&apos;S BOARD</span>
        <h1>Today&apos;s official plays.</h1>
        <p>Every bet posted, tracked and graded in public.</p>
      </section>

      <div className="stat-grid three">
        <div><span>Open</span><strong>{open.length}</strong></div>
        <div><span>All-time</span><strong className={(allTime?.net_units || 0) >= 0 ? "positive" : "negative"}>{formatUnits(allTime?.net_units ?? 0)}</strong></div>
        <div><span>ROI</span><strong className={(allTime?.roi_pct || 0) >= 0 ? "positive" : "negative"}>{formatRoi(allTime?.roi_pct ?? null)}</strong><small>profit ÷ actual risk</small></div>
      </div>

      <section>
        <div className="section-head"><h2>Open positions</h2><span>{open.length} active</span></div>
        <div className="list">
          {open.length ? open.map((bet) => <BetRow key={bet.id} bet={bet} />) : <div className="empty">No open positions.</div>}
        </div>
      </section>

      <section>
        <div className="section-head"><h2>Latest results</h2><a href="/history">Full history</a></div>
        <div className="list">
          {recent.length ? recent.map((bet) => <BetRow key={bet.id} bet={bet} />) : <div className="empty">No graded results yet.</div>}
        </div>
      </section>
    </main>
  );
}
