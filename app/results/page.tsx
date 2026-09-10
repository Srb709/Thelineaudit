import type { Metadata } from "next";
import { formatDate, formatOdds, formatRoi, formatUnits, getPublicBets, getRoiSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TheLineAudit Results",
  description: "Settled TheLineAudit bets only.",
};

export default async function ResultsPage() {
  const [bets, roiRows] = await Promise.all([getPublicBets(), getRoiSummary()]);
  const settled = bets.filter((bet) => bet.status !== "pending");
  const allTime = roiRows.find((row) => row.sport === "ALL_TIME");

  const wins = settled.filter((bet) => bet.status === "win").length;
  const losses = settled.filter((bet) => bet.status === "loss").length;
  const pushes = settled.filter((bet) => bet.status === "push").length;

  return (
    <main>
      <section className="hero compact">
        <span className="eyebrow">THELINEAUDIT RESULTS</span>
        <h1>Every finished bet.</h1>
        <p>Settled plays only. Full record, units and ROI.</p>
      </section>

      <div className="stat-grid three">
        <div><span>Record</span><strong>{wins}-{losses}-{pushes}</strong></div>
        <div><span>Units</span><strong className={(allTime?.net_units || 0) >= 0 ? "positive" : "negative"}>{formatUnits(allTime?.net_units ?? 0)}</strong></div>
        <div><span>ROI</span><strong className={(allTime?.roi_pct || 0) >= 0 ? "positive" : "negative"}>{formatRoi(allTime?.roi_pct ?? null)}</strong></div>
      </div>

      <section>
        <div className="section-head"><h2>Latest results</h2><span>{settled.length} graded</span></div>
        <div className="list">
          {settled.length ? settled.map((bet) => (
            <div className="bet-row" key={bet.id}>
              <div className="bet-top">
                <span className="league">{bet.sport}</span>
                <span className="date">{formatDate(bet.event_date || bet.created_at)}</span>
              </div>
              <div className="selection">{bet.selection}</div>
              <div className="bet-bottom">
                <span>{Number(bet.target_profit_units)}u to win</span>
                <b>{formatOdds(Number(bet.american_odds))}</b>
                <span className={`result ${bet.status}`}>
                  {bet.status}
                  <em>{formatUnits(bet.net_units)}</em>
                </span>
              </div>
            </div>
          )) : <div className="empty">No graded results yet.</div>}
        </div>
      </section>
    </main>
  );
}
