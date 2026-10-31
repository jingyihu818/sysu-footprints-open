import type { HistoryEvent } from "../types/content";
import type { HistoricalImage } from "../history/media";
import { SourceIcon } from "./Icon";
import "../stage02-media.css";

type ChapterEvidenceConfig = { title: string; intro: string; imageIds: string[] };

const chapterEvidence: Record<string, ChapterEvidenceConfig> = {
  p1927: { title: "校名沿革与学术启程", intro: "先看三页原件，再进入1927年的校名沿革与研究组织档案。", imageIds: ["hist-1927-renaming-letter", "hist-1928-renaming-letter", "hist-1927-journal-contents"] },
  p1938: { title: "迁徙路上的纸页", intro: "从迁校文书、西行测绘到坪石水文报道，几张图像串起战时办学的路径。", imageIds: ["hist-1938-migration-document", "hist-1939-du-westward", "hist-1944-hydrology-report"] },
  p1947: { title: "五·卅一事件的几页原迹", intro: "游行、冲突与纪念留下不同性质的材料；图像先行，卷宗随后展开。", imageIds: ["hist-1947-may-march", "hist-1947-march-attack", "hist-1947-blood-debt"] },
};

function DirectImage({ image }: { image: HistoricalImage }) {
  return <img src={image.thumbnailUrl} width={image.width} height={image.height} alt={image.alt} loading="eager" fetchPriority="high" decoding="sync" />;
}

export default function ChapterEvidencePreview({ periodId, periodRange, events, images, onOpen, onSources }: {
  periodId: string; periodRange: string; events: HistoryEvent[]; images: HistoricalImage[];
  onOpen: (id: string) => void; onSources: (ids: string[]) => void;
}) {
  const config = chapterEvidence[periodId];
  if (!config) return null;
  const eventByImage = new Map(events.flatMap((event) => event.media.map((media) => [media.id, event] as const)));
  const selected = config.imageIds.map((id) => images.find((image) => image.id === id)).filter((image): image is HistoricalImage => Boolean(image));
  if (!selected.length) return null;
  return <section className="chapter-evidence" aria-labelledby={"chapter-evidence-" + periodId} data-period-id={periodId}>
    <div className="chapter-evidence-heading">
      <div><p className="eyebrow">章节代表史料 / SELECTED RECORDS</p><h3 id={"chapter-evidence-" + periodId}>{config.title}</h3></div>
      <p>{config.intro}</p>
    </div>
    <div className="chapter-evidence-grid">
      {selected.map((image, index) => {
        const event = eventByImage.get(image.id);
        return <figure className={index === 0 ? "chapter-evidence-card featured" : "chapter-evidence-card"} key={image.id} data-media-id={image.id}>
          <button className="chapter-evidence-image" type="button" onClick={() => onOpen(image.id)} aria-label={"展开原图：" + image.title} aria-haspopup="dialog">
            <DirectImage image={image} /><span>展开原图</span>
          </button>
          <figcaption>
            <span className="chapter-evidence-folio">{periodRange}{image.historicalDate ? " · " + image.historicalDate : ""}</span>
            <strong>{image.title}</strong><span>{image.caption ?? image.alt}</span>
            {event && <small>所在档案：{event.title}</small>}
            <button className="historical-source" type="button" onClick={() => onSources(image.sourceIds)}><SourceIcon /> 图像出处</button>
          </figcaption>
        </figure>;
      })}
    </div>
  </section>;
}
