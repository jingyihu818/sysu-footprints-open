import type { ReactNode } from "react";
import type { HistoryEvent, Period, Place, Source } from "../types/content";
import { Arrow, SourceIcon } from "./Icon";
import historyCopy from "../history/copy";
import { sourceTitle } from "../history/sourcePresentation";
import { readingParagraphs } from "../history/paragraphs";
import PeopleContext, { EvidenceSupplements } from "./PeopleContext";

const statusLabels = {
  draft: "草稿",
  pending: "正在核对",
  approved: "历史档案",
  adopted: "历史档案",
  rejected: "暂不展示",
};

const modeLabels: Record<string, string> = {
  school: "学校迁校",
  organization: "组织活动",
  archive: "档案专题",
};

function eventMode(event: HistoryEvent) {
  return event.viewModes?.map((mode) => modeLabels[mode] ?? mode).join(" / ") ?? "事件档案";
}

export default function EventPanel({
  event,
  events,
  period,
  places,
  sources,
  isDemo,
  isHistoryPreview,
  isSyntheticTest = false,
  onEvent,
  onSources,
  onPreviousPeriod,
  onNextPeriod,
  renderMedia,
  relatedEvents = events,
  onRelatedEvent = onEvent,
  onPlace,
}: {
  event: HistoryEvent | null;
  events: HistoryEvent[];
  period: Period;
  places: Place[];
  sources: Source[];
  isDemo: boolean;
  isHistoryPreview: boolean;
  isSyntheticTest?: boolean;
  onEvent: (id: string) => void;
  onSources: () => void;
  onPreviousPeriod?: () => void;
  onNextPeriod?: () => void;
  renderMedia?: (event: HistoryEvent) => ReactNode;
  relatedEvents?: HistoryEvent[];
  onRelatedEvent?: (id: string) => void;
  onPlace?: (id: string) => void;
}) {
  const placeName = (id: string) => places.find((place) => place.id === id)?.name ?? "地点未详";
  return (
    <aside className="event-panel" aria-labelledby="event-panel-title" aria-live="polite">
      <span className="gilded-light gilded-archive" aria-hidden="true" />
      <div className="panel-top">
        <span>档案阅览 / ARCHIVE</span>
        <span>{isSyntheticTest ? "TEST ONLY · 合成夹具" : isDemo ? "MOCK" : isHistoryPreview ? historyCopy.panelBadge : "正式档案"}</span>
      </div>
      {event ? (
        <>
          <p className="eyebrow event-kicker">
            {period.range} / {isDemo ? "演示卡片" : eventMode(event)}
          </p>
          <h3 id="event-panel-title" tabIndex={-1}>{event.title}</h3>
          <div className="review-row">
            <span className={"status-pill " + (event.status === "approved" ? "approved" : "")}>
              {isSyntheticTest ? "TEST ONLY · 合成测试" : event.isMock ? "MOCK · " : isHistoryPreview ? historyCopy.status : statusLabels[event.status]}
            </span>
          </div>
          {events.length > 1 && (
            <div className="event-picker" aria-label="本章节事件目录">
              {events.map((item) => (
                <button key={item.id} aria-pressed={event.id === item.id} onClick={() => onEvent(item.id)}>
                  <span>{item.date.label}</span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </div>
          )}
          <dl className="event-meta">
            <div><dt>发生时间</dt><dd>{event.date.label}</dd></div>
            <div><dt>发生地点</dt><dd>{event.placeIds.length ? event.placeIds.map(id => onPlace ? <button className="event-place-link" type="button" key={id} onClick={() => onPlace(id)}>{placeName(id)} ↗</button> : <span key={id}>{placeName(id)} </span>) : "未标出单一地点"}</dd></div>
            {event.participants.length > 0 && <div><dt>人物 / 组织</dt><dd>{event.participants.join("、")}</dd></div>}
          </dl>
          <div className="event-prose">
            <h4>{isHistoryPreview ? historyCopy.summary : "档案正文"}</h4>
            {readingParagraphs(event.displayText ?? event.factSummary).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            {isHistoryPreview && event.archiveBlocks?.length ? (
              <>
                <h4>{historyCopy.excerpts}</h4>
                <div className="archive-excerpts">
                  {event.archiveBlocks.map((block) => <p key={block.id}>{block.text}</p>)}
                </div>
                <p className="preview-note">{historyCopy.previewNote}</p>
              </>
            ) : (
              <>
                {event.historicalSignificance && <><h4>历史意义</h4><p>{event.historicalSignificance}</p></>}
                {event.learningReflection && <><h4>本组学习感悟</h4><p>{event.learningReflection}</p></>}
              </>
            )}
          </div>
          <EvidenceSupplements event={event} sources={sources} />
          <PeopleContext event={event} events={relatedEvents} sources={sources} onEvent={onRelatedEvent} />
          {renderMedia && (isHistoryPreview || event.media.some((item) => item.type === "image")) ? renderMedia(event) : event.media.length > 0 ? (
            <div className="event-media">{event.media.map((m) => <figure key={m.id}><img src={import.meta.env.BASE_URL + m.path} alt={m.alt} loading="lazy" /><figcaption>{m.alt} · {m.rights}</figcaption></figure>)}</div>
          ) : isHistoryPreview ? (
            <p className="media-placeholder">{historyCopy.media}</p>
          ) : null}
          <div className="reference-summary">
            <h4>相关文献</h4>
            {event.sourceIds.length ? event.sourceIds.map((id) => <p key={id}>{sourceTitle(sources.find((source) => source.id === id)?.title)}</p>) : <p>本段叙述未另列单独出处。</p>}
          </div>
          <button className="source-button" onClick={onSources} aria-haspopup="dialog">
            <SourceIcon /> 查看本段出处 <span>{event.sourceIds.length} 条</span><Arrow />
          </button>
        </>
      ) : (
        <>
          <p className="eyebrow event-kicker">{period.range} / 章节目录</p>
          <h3 id="event-panel-title">{period.title}</h3>
          <p className="panel-intro">
            {isHistoryPreview ? historyCopy.intro : isDemo ? "选择地图上的地点，打开一张 MOCK 演示档案。" : events.length ? "从下方目录打开历史档案，阅读正文并查看文献依据。" : "本章当前没有可阅读的正式历史档案。"}
          </p>
          {events.length ? (
            <div className="event-directory" aria-label="章节事件目录">
              {events.map((item) => <button key={item.id} onClick={() => onEvent(item.id)}><span>{item.date.label}</span><strong>{item.title}</strong><small>{eventMode(item)} · {item.placeIds.length ? item.placeIds.map(placeName).join("、") : "专题档案"}</small></button>)}
            </div>
          ) : (
            <div className="empty-file"><SourceIcon /><span>{isHistoryPreview ? historyCopy.noEvents : isDemo ? "本演示章节没有示例档案" : "本章当前没有独立档案。"}</span><small>{isHistoryPreview ? historyCopy.noEventsNote : isDemo ? "请选择其他演示时期。" : "待完成来源核验与发布流程后再补充，不以其他年代内容或虚构地点填补。"}</small>
              {!isHistoryPreview && !isDemo && <div className="empty-chapter-actions">{onPreviousPeriod && <button type="button" onClick={onPreviousPeriod}>← 返回上一章</button>}{onNextPeriod && <button type="button" onClick={onNextPeriod}>前往下一章 →</button>}</div>}
            </div>
          )}
          <dl className="overview-meta">
            <div><dt>阅读方式</dt><dd>{isHistoryPreview ? historyCopy.chapterStatus : isDemo ? "交互演示" : "按时间、地点与来源探索"}</dd></div>
            <div><dt>可用档案</dt><dd>{events.length} 张{isDemo ? " MOCK 卡片" : "事件档案"}</dd></div>
            <div><dt>阅读方式</dt><dd>{isHistoryPreview ? historyCopy.reading : "时间 → 地点 → 档案 → 来源"}</dd></div>
          </dl>
        </>
      )}
    </aside>
  );
}
