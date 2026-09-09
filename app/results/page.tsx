import type { Metadata } from "next";
import { BetRow } from "../components";
import { formatRoi, formatUnits, getPublicBets, getRoiSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "TheLineAudit Results",
  description: "Settled TheLineAudit bets only. No open positions are shown here.",
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
        <p>Settled plays only. Open positions stay private until they are graded.</p>
      </section>

      <div className="stat-grid three">
        <div><span>Record</span><strong>{wins}-{losses}-{pushes}</strong></div>
        <div><span>Units</span><strong className={(allTime?.net_units || 0) >= 0 ? "positive" : "negative"}>{formatUnits(allTime?.net_units ?? 0)}</strong></div>
        <div><span>ROI</span><strong className={(allTime?.roi_pct || 0) >= 0 ? "positive" : "negative"}>{formatRoi(allTime?.roi_pct ?? null)}</strong></div>
      </div>

      <section>
        <div className="section-head"><h2>Latest results</h2><span>{settled.length} graded</span></div>
        <div className="list">
          {settled.length ? settled.map((bet) => <BetRow key={bet.id} bet={bet} />) : <div className="empty">No graded results yet.</div>}
        </div>
      </section>
    </main>
  );
}
