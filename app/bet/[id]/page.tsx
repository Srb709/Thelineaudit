import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatOdds, formatUnits, getPublicBets } from "@/lib/data";
import { manualGradeBet } from "./actions";
import { isOwner } from "@/lib/owner";

export const dynamic = "force-dynamic";

export default async function BetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bets = await getPublicBets();
  const bet = bets.find((item) => item.id === id);
  if (!bet) notFound();
  const owner = await isOwner();

  return (
    <main>
      <Link href="/history" className="back">← Betting history</Link>
      <section className="detail-card">
        <div className="bet-top"><span className="league">{bet.sport}</span><span className={`result ${bet.status}`}>{bet.status}</span></div>
        <h1>{bet.selection}</h1>
        <p>{formatDate(bet.event_date || bet.created_at)}</p>
        <div className="detail-grid">
          <div><span>Price</span><strong>{formatOdds(Number(bet.american_odds))}</strong></div>
          <div><span>Target</span><strong>{Number(bet.target_profit_units)}u</strong></div>
          <div><span>Result</span><strong className={(bet.net_units || 0) >= 0 ? "positive" : "negative"}>{bet.status === "pending" ? "Pending" : formatUnits(bet.net_units)}</strong></div>
        </div>
        <div className="detail-grid two">
          <div><span>Risk</span><strong>{Number(bet.risk_units).toFixed(2)}u</strong></div>
          <div><span>Market</span><strong>{bet.market || bet.bet_type}</strong></div>
        </div>
        {bet.final_score ? <div className="final"><span>Final</span><strong>{bet.final_score}</strong></div> : null}
        {bet.grading_source ? <footer>{bet.grading_source}</footer> : null}
      </section>

      {owner ? (
        <section className="owner-grade-card">
          <div>
            <span className="eyebrow">OWNER CONTROL</span>
            <h2>Correct result</h2>
            <p>If automation misses one, fix it here. Your manual result overrides the grader.</p>
          </div>
          <form action={manualGradeBet} className="grade-actions">
            <input type="hidden" name="id" value={bet.id} />
            <button type="submit" name="result" value="win" className="grade-win">Win</button>
            <button type="submit" name="result" value="loss" className="grade-loss">Loss</button>
            <button type="submit" name="result" value="push">Push</button>
            <button type="submit" name="result" value="void">Void</button>
            <button type="submit" name="result" value="auto" className="grade-auto">Return to auto grading</button>
          </form>
        </section>
      ) : null}

      {bet.post_text ? (
        <section className="tweet-card">
          <div className="tweet-head"><div className="x-avatar">TL</div><div><strong>TheLineAudit</strong><span>@TheLineAudit · {formatDate(bet.posted_at || bet.created_at)}</span></div><b>𝕏</b></div>
          <p>{bet.post_text}</p>
          <div className="tweet-stats"><span>{Number(bet.impressions || 0).toLocaleString()} views</span><span>{Number(bet.likes || 0)} likes</span><span>{Number(bet.replies || 0)} replies</span></div>
          {bet.post_url ? <a href={bet.post_url} target="_blank" rel="noreferrer">View original post ↗</a> : null}
        </section>
      ) : null}
    </main>
  );
}
