"use client";

import { useMemo, useState } from "react";
import { BetRow } from "../components";
import type { PublicBet } from "@/lib/data";

export default function HistoryList({ bets }: { bets: PublicBet[] }) {
  const [sport, setSport] = useState("All");
  const [status, setStatus] = useState("All");
  const sports = ["All", ...Array.from(new Set(bets.map((bet) => bet.sport)))];

  const filtered = useMemo(() => bets.filter((bet) => {
    const sportMatch = sport === "All" || bet.sport === sport;
    const statusMatch = status === "All" || bet.status === status.toLowerCase();
    return sportMatch && statusMatch;
  }), [bets, sport, status]);

  return (
    <>
      <div className="scroll-pills">
        {sports.map((item) => <button key={item} className={sport === item ? "active" : ""} onClick={() => setSport(item)}>{item}</button>)}
      </div>
      <div className="segmented">
        {["All", "Win", "Loss", "Pending"].map((item) => <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}</button>)}
      </div>
      <div className="list">
        {filtered.length ? filtered.map((bet) => <BetRow key={bet.id} bet={bet} />) : <div className="empty">No plays in this filter.</div>}
      </div>
    </>
  );
}
