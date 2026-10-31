import { useEffect, useRef } from "react";
import "./centennial-exhibit.css";

export interface CentennialData {
  sourceUrl: string;
  sourceTitle: string;
  intro: string;
  letterSummary: string;
  excerpts: string[];
  /** Supply authorized historical images; captions must include their verified dates. */
  images: { src: string; alt: string; caption: string; sourceUrl: string }[];
  milestones: {
    year: string;
    title: string;
    text: string;
    eventId?: string;
    sourceUrl: string;
  }[];
}

interface CentennialExhibitProps {
  open: boolean;
  onClose: () => void;
  onHistory: () => void;
  onToday: () => void;
  onEvent: (id: string) => void;
  data: CentennialData;
}

function paragraphs(text: string): string[] {
  return text.split(/\r?\n\s*\r?\n/).map((part) => part.trim()).filter(Boolean);
}

export default function CentennialExhibit({
  open,
  onClose,
  onHistory,
  onToday,
  onEvent,
  data,
}: CentennialExhibitProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const dismissedRef = useRef(true);

  function restoreFocus() {
    const target = returnFocusRef.current;
    returnFocusRef.current = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    dismissedRef.current = false;
    const previousOverflow = document.body.style.overflow;
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    titleRef.current?.focus({ preventScroll: true });

    return () => {
      dismissedRef.current = true;
      if (dialog.open) dialog.close();
      if (document.body.style.overflow === "hidden") {
        document.body.style.overflow = previousOverflow;
      }
      restoreFocus();
    };
  }, [open]);

  function dismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    dialogRef.current?.close();
    restoreFocus();
    onClose();
  }

  function navigate(action: () => void) {
    dismiss();
    action();
  }

  const excerpts = data.excerpts.filter((text) => text.trim());
  const images = data.images.filter((image) => image.src.trim());

  return (
    <dialog
      id="centennial"
      ref={dialogRef}
      className="centennial-exhibit"
      aria-labelledby="centennial-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href]',
        )).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (!first || !last) return;
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === titleRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClose={(event) => {
        // Ignore queued close events from effect cleanup or an earlier opening.
        if (event.currentTarget.open || dismissedRef.current) return;
        dismissedRef.current = true;
        restoreFocus();
        onClose();
      }}
    >
      <header className="centennial-exhibit__header">
        <h2 id="centennial-title" ref={titleRef} tabIndex={-1}>
          1924—2024：百年回望
        </h2>
        <button
          type="button"
          className="centennial-exhibit__close"
          onClick={dismiss}
          aria-label="关闭百年回望"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </header>

      <div ref={scrollRef} className="centennial-exhibit__scroll">
        <div className="centennial-exhibit__opening">
          <div className="centennial-exhibit__century" aria-hidden="true">
            <span>1924</span>
            <span className="centennial-exhibit__century-line"><span>百年</span></span>
            <span>2024</span>
          </div>
          {data.intro.trim() && (
            <div className="centennial-exhibit__intro">
              {paragraphs(data.intro).map((text, index) => <p key={index}>{text}</p>)}
            </div>
          )}
        </div>

        <div className="centennial-exhibit__paper">
          <div className={"centennial-exhibit__reading" + (data.milestones.length ? " centennial-exhibit__reading--with-timeline" : "")}>
            <section className="centennial-exhibit__letter" aria-labelledby="centennial-letter-title">
              <h3 id="centennial-letter-title">百年之际的贺信</h3>
              <p className="centennial-exhibit__dateline">
                <time dateTime="2024-11-12">2024年11月12日</time>
              </p>
              {paragraphs(data.letterSummary).map((text, index) => <p className="centennial-exhibit__prose" key={index}>{text}</p>)}
              {excerpts.length > 0 && (
                <div className="centennial-exhibit__excerpts">
                  <h4>文字摘录</h4>
                  {excerpts.map((excerpt, index) => (
                    <blockquote cite={data.sourceUrl || undefined} key={index}>
                      {paragraphs(excerpt).map((text, paragraphIndex) => <p key={paragraphIndex}>{text}</p>)}
                    </blockquote>
                  ))}
                </div>
              )}
              {(data.sourceTitle.trim() || data.sourceUrl.trim()) && (
                <p className="centennial-exhibit__source">
                  <span>贺信出处</span>
                  {data.sourceUrl.trim() ? (
                    <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
                      {data.sourceTitle.trim() || "查阅原文"}
                    </a>
                  ) : <cite>{data.sourceTitle}</cite>}
                </p>
              )}
            </section>

            {data.milestones.length > 0 && (
              <section className="centennial-exhibit__timeline" aria-labelledby="centennial-timeline-title">
                <h3 id="centennial-timeline-title">沿时间回望</h3>
                <ol>
                  {data.milestones.map((milestone, index) => (
                    <li key={index}>
                      <p className="centennial-exhibit__year">{milestone.year}</p>
                      <h4>{milestone.title}</h4>
                      {paragraphs(milestone.text).map((text, paragraphIndex) => <p className="centennial-exhibit__milestone-text" key={paragraphIndex}>{text}</p>)}
                      <div className="centennial-exhibit__milestone-actions">
                        {milestone.eventId?.trim() && (
                          <button
                            type="button"
                            onClick={() => navigate(() => onEvent(milestone.eventId!))}
                            aria-label={"阅读档案：" + milestone.year + " · " + milestone.title}
                          >阅读档案</button>
                        )}
                        {milestone.sourceUrl.trim() && (
                          <a href={milestone.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={"查看出处：" + milestone.year + " · " + milestone.title}>查看出处</a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          {images.length > 0 && (
            <section className="centennial-exhibit__images" aria-labelledby="centennial-images-title">
              <h3 id="centennial-images-title">历史影像</h3>
              <div className="centennial-exhibit__image-grid">
                {images.map((image, index) => (
                  <figure key={index}>
                    <div className="centennial-exhibit__image-mount">
                      <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
                    </div>
                    <figcaption>
                      <p>{image.caption}</p>
                      {image.sourceUrl.trim() && <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={"查看影像出处：" + image.caption}>查看影像出处</a>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
        </div>

        <section className="centennial-exhibit__today" aria-labelledby="centennial-today-title">
          <h3 id="centennial-today-title">2026 · 九人创作终章</h3>
          <p>2024年的贺信与历史资料，和2026年九位共同创作者的文字与声音，分属不同年代。继续走进当代终章，阅读今天的创作。</p>
        </section>
      </div>

      <nav className="centennial-exhibit__footer" aria-label="继续阅读">
        <button type="button" onClick={() => navigate(onHistory)}>回到历史</button>
        <button type="button" className="centennial-exhibit__today-button" onClick={() => navigate(onToday)}>走进2026九人终章</button>
      </nav>
    </dialog>
  );
}
