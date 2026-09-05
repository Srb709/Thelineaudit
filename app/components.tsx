import Link from "next/link";
import type { PublicBet } from "@/lib/data";
import { formatDate, formatOdds, formatUnits } from "@/lib/data";

export function Mark() {
  return <div className="mark"><span>TL</span><i /></div>;
}

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <Link href="/"><span className="nav-icon today">●</span><span>Today</span></Link>
      <Link href="/history"><span className="nav-icon history">↻</span><span>History</span></Link>
      <Link href="/all-time"><span className="nav-icon record">▦</span><span>Record</span></Link>
      <Link href="/x-performance"><span className="nav-icon x">𝕏</span><span>Reach</span></Link>
    </nav>
  );
}

export function BetRow({ bet }: { bet: PublicBet }) {
  return (
    <Link className="bet-row" href={`/bet/${bet.id}`}>
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
          {bet.status !== "pending" ? <em>{formatUnits(bet.net_units)}</em> : null}
        </span>
      </div>
    </Link>
  );
}
