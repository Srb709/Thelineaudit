import { formatRoi, formatUnits, getPublicBets, getRoiSummary } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AllTimePage() {
  const [bets, roiRows] = await Promise.all([getPublicBets(), getRoiSummary()]);
  const allTime = roiRows.find((row) => row.sport === "ALL_TIME");
  const wins = bets.filter((bet) => bet.status === "win").length;
  const losses = bets.filter((bet) => bet.status === "loss").length;
  const pushes = bets.filter((bet) => bet.status === "push").length;
  const winRate = wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0;

  const bySport = Array.from(new Set(bets.map((bet) => bet.sport)))
    .map((sport) => {
      const group = bets.filter((bet) => bet.sport === sport);
      const row = roiRows.find((item) => item.sport === sport);
      return {
        sport,
        plays: group.length,
        wins: group.filter((bet) => bet.status === "win").length,
        losses: group.filter((bet) => bet.status === "loss").length,
        pushes: group.filter((bet) => bet.status === "push").length,
        netUnits: row?.net_units ?? 0,
        roi: row?.roi_pct ?? null,
        risk: row?.total_risk_units ?? 0,
      };
    })
    .sort((a, b) => b.plays - a.plays);

  return (
    <main>
      <section className="hero compact">
        <span className="eyebrow">ALL-TIME RECORD</span>
        <h1>The complete ledger.</h1>
        <p>The number is the number. Every official play is included.</p>
      </section>

      <section className="record-card">
        <div className="record-kpis">
          <div><span>NET UNITS</span><strong className={(allTime?.net_units || 0) >= 0 ? "positive" : "negative"}>{formatUnits(allTime?.net_units ?? 0)}</strong></div>
          <div className="roi-main"><span>ROI</span><strong className={(allTime?.roi_pct || 0) >= 0 ? "positive" : "negative"}>{formatRoi(allTime?.roi_pct ?? null)}</strong><small>{Number(allTime?.total_risk_units || 0).toFixed(2)}u risked</small></div>
        </div>
        <div className="record-line">
          <b>{wins}-{losses}-{pushes}</b>
          <span>{winRate}% win rate</span>
        </div>
      </section>

      <div className="section-head"><h2>By sport</h2><span>{bets.length} plays</span></div>
      <div className="league-grid">
        {bySport.map((item) => (
          <article key={item.sport}>
            <div><span className="league">{item.sport}</span><strong>{item.plays}</strong></div>
            <div className="league-meta">
              <span>{item.wins}-{item.losses}{item.pushes ? `-${item.pushes}` : ""}</span>
              <div className="league-return">
                <b className={item.netUnits >= 0 ? "positive" : "negative"}>{formatUnits(item.netUnits)}</b>
                <em className={Number(item.roi || 0) >= 0 ? "positive" : "negative"}>{formatRoi(item.roi)} ROI</em>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
