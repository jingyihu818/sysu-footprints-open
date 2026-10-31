import type { HistoryPreviewBundle } from "../history/adapter";

const classLabels: Record<string, string> = {
  "official-web": "官方校史网页",
  "official-news": "官方新闻",
  "official-periodical": "官方数字报",
};

export default function ResearchShelf({
  periodId,
  eventId,
  research,
}: {
  periodId: string;
  eventId: string | null;
  research: HistoryPreviewBundle["research"] | null;
}) {
  if (!research) return null;
  const cards = research.candidates.filter((item) => item.periodId === periodId && (!eventId || !item.eventId || item.eventId === eventId));
  if (!cards.length) return null;
  const sourceMap = new Map(research.sources.map((item) => [item.id, item]));
  const mediaMap = new Map(research.media.map((item) => [item.id, item]));
  return <section className="research-shelf" aria-labelledby="research-shelf-title">
    <div className="research-shelf-heading">
      <div>
        <p className="eyebrow">补充研究 / STAGE 04A.5</p>
        <h3 id="research-shelf-title">可供史料组确认的研究候选</h3>
      </div>
      <span className="research-badge">候选 · 未批准</span>
    </div>
    <p className="research-shelf-intro">这些材料有来源，但尚未成为正式网页展示稿；1927候选也不会改变本章当前的空事件状态。</p>
    <div className="research-card-grid">
      {cards.map((card) => {
        const sources = card.sourceIds.map((id) => sourceMap.get(id)).filter(Boolean);
        const media = card.mediaIds.map((id) => mediaMap.get(id)).filter(Boolean);
        return <article className="research-card" key={card.id} data-research-id={card.id}>
          <div className="research-card-meta"><span>{card.eventId ? "关联事件 · " + card.eventId : "章节研究候选"}</span><span>候选状态</span></div>
          <h4>{card.title}</h4>
          <p>{card.summary}</p>
          <p className="research-question"><strong>待确认：</strong>{card.reviewQuestion}</p>
          <div className="research-sources">
            <strong>来源追踪</strong>
            {sources.map((source) => <span key={source!.id}>
              {source!.url ? <a href={source!.url} target="_blank" rel="noopener noreferrer">{source!.title} ↗</a> : source!.title + "（原链接未确认）"}
              <small>{classLabels[source!.class] ?? source!.class} · {source!.institution}</small>
            </span>)}
          </div>
          {media.length > 0 && <div className="research-media-links"><strong>多媒体线索</strong>{media.map((item) => <a key={item!.id} href={item!.url} target="_blank" rel="noopener noreferrer">{item!.title} · {item!.status} ↗</a>)}</div>}
        </article>;
      })}
    </div>
  </section>;
}
