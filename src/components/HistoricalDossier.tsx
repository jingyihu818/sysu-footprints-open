import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import type { ExhibitionDossier } from "../types/exhibition";
import historyCopy from "../history/copy";
import type { MotionDirector } from "../motion/director";
import type { HistoryEvent, Place, Source } from "../types/content";
import { Arrow, SourceIcon } from "./Icon";
import { sourceTitle } from "../history/sourcePresentation";
import { readingParagraphs } from "../history/paragraphs";
import PeopleContext, { EvidenceSupplements } from "./PeopleContext";
import "../stage02-dossier.css";

export interface HistoricalDossierProps {
  dossier: ExhibitionDossier;
  pageIndex: number;
  events: HistoryEvent[];
  sources: Source[];
  places: Place[];
  reduced: boolean;
  director: MotionDirector;
  onPage: (index: number) => void;
  onClose: () => void;
  onSources: () => void;
  renderMedia?: (event: HistoryEvent) => ReactNode;
  isSyntheticTest?: boolean;
  relatedEvents?: HistoryEvent[];
  onRelatedEvent?: (id: string) => void;
}

/** An already-open, controlled archive within the explorer; the parent owns selection and focus restoration. */
export default function HistoricalDossier({
  dossier,
  pageIndex,
  events,
  sources,
  places,
  reduced,
  director,
  onPage,
  onClose,
  onSources,
  renderMedia,
  isSyntheticTest = false,
  relatedEvents = events,
  onRelatedEvent,
}: HistoricalDossierProps) {
  const id = useId();
  const leaf = useRef<HTMLSpanElement>(null);
  const previous = useRef({ dossierId: dossier.id, pageIndex });
  const page = Number.isInteger(pageIndex) ? dossier.pages[pageIndex] : undefined;
  const pageId = page?.id;
  const motionGroup = `dossier-leaf-${id}`;
  const eventById = new Map(events.map((event) => [event.id, event]));
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const placeById = new Map(places.map((place) => [place.id, place]));
  const placeName = (placeId: string) => placeById.get(placeId)?.name ?? "地点未详";

  useEffect(() => {
    const before = previous.current;
    previous.current = { dossierId: dossier.id, pageIndex };
    const cancel = () => director.cancel(motionGroup);
    cancel();
    // Only the decorative paper edge moves. The new text is immediately readable.
    if (!reduced && pageId && !document.hidden &&
      (before.dossierId !== dossier.id || before.pageIndex !== pageIndex) && leaf.current) {
      const offset = pageIndex < before.pageIndex ? -8 : 8;
      void director.play(motionGroup, [{
        element: leaf.current,
        keyframes: [
          { opacity: 0.65, transform: `translateX(${offset}px)` },
          { opacity: 0, transform: "translateX(0)" },
        ],
        options: { duration: 210, easing: "cubic-bezier(.16,1,.3,1)" },
      }]);
    }
    const onVisibility = () => { if (document.hidden) cancel(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", cancel);
    window.addEventListener("resize", cancel);
    return () => {
      cancel();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("resize", cancel);
    };
  }, [director, dossier.id, pageId, pageIndex, reduced, motionGroup]);

  function goTo(index: number) {
    if (index !== pageIndex && index >= 0 && index < dossier.pages.length) onPage(index);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey ||
      event.shiftKey || event.nativeEvent.isComposing || !page) return;
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    // Native editing, media, links and child widgets retain their own keys.
    if (target.closest('input, textarea, select, a, audio, video, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="slider"], [role="combobox"], [role="listbox"], [role="menu"], [role="dialog"]')) return;
    if (target !== event.currentTarget && !target.closest("[data-dossier-navigation]")) return;
    const destination = event.key === "ArrowLeft" ? pageIndex - 1
      : event.key === "ArrowRight" ? pageIndex + 1
        : event.key === "Home" ? 0
          : event.key === "End" ? dossier.pages.length - 1 : null;
    if (destination === null) return;
    event.preventDefault();
    goTo(destination);
  }

  return (
    <section
      className="historical-dossier"
      data-dossier-id={dossier.id}
      data-motion={reduced ? "reduced" : "full"}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-help`}
      aria-keyshortcuts="ArrowLeft ArrowRight Home End"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <header className="dossier-header">
        <div>
          <p className="dossier-kicker">1947 / 事件卷宗</p>
          <h3 id={`${id}-title`}>{dossier.title}</h3>
          <p className="dossier-preview-label">{isSyntheticTest ? "TEST ONLY · 合成卷宗夹具" : dossier.status === "approved" || dossier.status === "adopted" ? "六页卷宗 · 沿着事件脉络阅读" : "内部预览 · 候选摘录"}</p>
        </div>
        <button type="button" className="dossier-return" onClick={onClose}>
          <Arrow direction="left" /> 返回1947章节
        </button>
      </header>

      <nav className="dossier-directory" aria-label="卷宗六页目录">
        <ol>
          {dossier.pages.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                data-dossier-navigation
                aria-current={pageIndex === index ? "page" : undefined}
                aria-controls={`${id}-page`}
                aria-label={`第${index + 1}页：${item.title}`}
                onClick={() => goTo(index)}
              >
                <span className="dossier-directory-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span>{item.title}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <p className="dossier-help" id={`${id}-help`}>
        目录可直接跳页。聚焦卷宗或翻页按钮时，用左右方向键翻页，Home / End 到首页或末页。
      </p>

      <div className="dossier-paper-stack">
        <span ref={leaf} className="dossier-turn-edge" aria-hidden="true" />
        <div className="dossier-page" id={`${id}-page`}>
          {page ? (
            <>
              <div className="dossier-page-heading">
                <h4>{page.title}</h4>
                <span className="dossier-folio" aria-hidden="true">{String(pageIndex + 1).padStart(2, "0")} / {String(dossier.pages.length).padStart(2, "0")}</span>
              </div>
              {page.eventIds.map((eventId) => {
                const event = eventById.get(eventId);
                if (!event) return <p className="dossier-empty" key={eventId}>本页事件资料尚未载入。</p>;
                const media = renderMedia?.(event);
                return (
                  <article className="dossier-event" key={event.id} data-event-id={event.id}>
                    <p className="dossier-date">{event.date.label}</p>
                    <h5>{event.title}</h5>
                    <dl className="dossier-meta">
                      <div><dt>发生地点</dt><dd>{event.placeIds.length ? event.placeIds.map(placeName).join("、") : "未标出单一地点"}</dd></div>
                      {event.participants.length > 0 && <div><dt>人物 / 组织</dt><dd>{event.participants.join("、")}</dd></div>}
                    </dl>
                    <div className="dossier-prose">
                      <h6>{historyCopy.summary || "摘要"}</h6>
                      <p>{event.factSummary}</p>
                      {event.displayText ? (
                        <><h6>正文</h6>{readingParagraphs(event.displayText).map((text, index) => <p key={index}>{text}</p>)}</>
                      ) : event.archiveBlocks?.length ? (
                        <>
                          <h6>{historyCopy.excerpts || "内部摘录预览"}</h6>
                          <div className="dossier-excerpts">
                            {event.archiveBlocks.map((block) => <p key={block.id} data-block-id={block.id}>{block.text}</p>)}
                          </div>
                        </>
                      ) : <p className="dossier-empty">当前事件尚无正文摘录。</p>}
                      {!event.displayText && <p className="dossier-preview-note">{historyCopy.previewNote || "当前内容来自已交付原稿摘录，尚未形成正式网页展示稿。"}</p>}
                    </div>
                    <EvidenceSupplements event={event} sources={sources} />
                    <PeopleContext event={event} events={relatedEvents} sources={sources} onEvent={onRelatedEvent} />
                    {media != null && media !== false ? (
                      <div className="dossier-media">{media}</div>
                    ) : <p className="dossier-media-note">这一页暂未配图，相关线索保留在出处说明中。</p>}
                  </article>
                );
              })}
              <section className="dossier-sources" aria-labelledby={`${id}-sources`}>
                <h5 id={`${id}-sources`}>本页出处</h5>
                {page.sourceIds.length ? (
                  <ul>{page.sourceIds.map((sourceId) => <li key={sourceId} data-source-id={sourceId}>{sourceTitle(sourceById.get(sourceId)?.title)}</li>)}</ul>
                ) : <p>本页未另列单独出处。</p>}
                <button type="button" className="dossier-source-button" aria-haspopup="dialog" onClick={onSources}>
                  <SourceIcon /><span>查看本页出处 · {page.sourceIds.length} 条</span><Arrow />
                </button>
              </section>
            </>
          ) : <p className="dossier-empty">请选择目录中的一页，开始阅读卷宗。</p>}
        </div>
      </div>

      <nav className="dossier-pagination" aria-label="卷宗翻页">
        <button type="button" data-dossier-navigation disabled={!page || pageIndex === 0} onClick={() => goTo(pageIndex - 1)}>
          <Arrow direction="left" /> 上一页
        </button>
        <p className="dossier-position" role="status" aria-atomic="true">
          {page ? `第 ${pageIndex + 1} / ${dossier.pages.length} 页 · ${page.title}` : "尚未选择页面"}
        </p>
        <button type="button" data-dossier-navigation disabled={!page || pageIndex === dossier.pages.length - 1} onClick={() => goTo(pageIndex + 1)}>
          下一页 <Arrow />
        </button>
      </nav>
    </section>
  );
}
