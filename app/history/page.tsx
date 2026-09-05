import { getPublicBets } from "@/lib/data";
import HistoryList from "./history-list";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const bets = await getPublicBets();
  return (
    <main>
      <section className="hero compact">
        <span className="eyebrow">BET HISTORY</span>
        <h1>Every official play.</h1>
        <p>No deleted losses. No selective record. Newest first.</p>
      </section>
      <HistoryList bets={bets} />
    </main>
  );
}
