import { getPublicBets } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function XPerformancePage() {
  const bets = await getPublicBets();
  const posts = bets.filter((bet) => bet.x_post_id && bet.impressions != null);
  const totalViews = posts.reduce((sum, bet) => sum + Number(bet.impressions || 0), 0);
  const totalLikes = posts.reduce((sum, bet) => sum + Number(bet.likes || 0), 0);
  const totalReplies = posts.reduce((sum, bet) => sum + Number(bet.replies || 0), 0);
  const avgViews = posts.length ? Math.round(totalViews / posts.length) : 0;
  const top = [...posts].sort((a, b) => Number(b.impressions || 0) - Number(a.impressions || 0)).slice(0, 5);

  return (
    <main>
      <section className="hero compact">
        <span className="eyebrow">𝕏 PERFORMANCE</span>
        <h1>What&apos;s actually getting seen.</h1>
        <p>Official-play posts with the latest captured X metrics.</p>
      </section>
      <div className="stat-grid three">
        <div><span>Total views</span><strong>{totalViews.toLocaleString()}</strong></div>
        <div><span>Avg views</span><strong>{avgViews.toLocaleString()}</strong></div>
        <div><span>Replies</span><strong>{totalReplies.toLocaleString()}</strong><small>{totalLikes.toLocaleString()} likes</small></div>
      </div>
      <div className="section-head"><h2>Top official posts</h2><span>{posts.length} tracked</span></div>
      <div className="list">
        {top.map((bet) => (
          <a className="top-post" href={bet.post_url || `/bet/${bet.id}`} target={bet.post_url ? "_blank" : undefined} rel={bet.post_url ? "noreferrer" : undefined} key={bet.id}>
            <span>{bet.sport}</span>
            <p>{bet.selection}</p>
            <div><b>{Number(bet.impressions || 0).toLocaleString()} views</b><span>{Number(bet.likes || 0)} likes</span><span>{Number(bet.replies || 0)} replies</span></div>
          </a>
        ))}
      </div>
    </main>
  );
}
