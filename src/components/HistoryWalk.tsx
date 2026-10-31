import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { HistoryWalk as Walk } from "../history/walkModel";
import { walkIndex } from "../history/walkModel";
import type { Source } from "../types/content";

export default function HistoryWalk({ data, sources, onStep, onExit }: {
  data: Walk; sources: Source[]; onStep: (eventId: string, placeId: string) => void; onExit: () => void;
}) {
  const [open, setOpen] = useState(false), [index, setIndex] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLElement>(null);
  const step = data.steps[index];
  useEffect(() => { if (open) panel.current?.focus({ preventScroll: true }); }, [open]);
  if (!data.steps.length) return null;
  function select(next: number) { setIndex(next); const item = data.steps[next]; onStep(item.eventId, item.placeId); }
  function close() { setOpen(false); onExit(); requestAnimationFrame(() => trigger.current?.focus({ preventScroll: true })); }
  function key(event: KeyboardEvent) {
    if (!open || event.altKey || event.metaKey || event.ctrlKey) return;
    if (event.key === "Escape") { event.preventDefault(); close(); return; }
    if (event.target instanceof HTMLElement && event.target.closest("a,input,select,textarea")) return;
    const direction = ({ ArrowRight: "next", ArrowLeft: "previous", Home: "first", End: "last" } as const)[event.key as "ArrowRight"];
    if (direction) { event.preventDefault(); select(walkIndex(index, direction, data.steps.length)); }
  }
  return <section className="history-walk" aria-label="1947空间叙事" onKeyDown={key}>
    <button ref={trigger} type="button" className="walk-trigger" aria-expanded={open} onClick={() => { if (open) close(); else { setOpen(true); select(0); } }}>
      <span><small>1947 / 循路读史</small><strong>{data.title}</strong></span><span>{open ? "收起叙事 ↑" : "沿着史料，逐步展开 →"}</span>
    </button>
    {open && <article ref={panel} tabIndex={-1} className="walk-panel" aria-labelledby="walk-title">
      <p className="walk-description">{data.description}</p>
      <ol className="walk-step-index" aria-label="空间叙事步骤">{data.steps.map((item, n) => <li key={item.id}><button type="button" aria-current={index === n ? "step" : undefined} onClick={() => select(n)} aria-label={`第${n + 1}步：${item.title}`}>{String(n + 1).padStart(2, "0")}</button></li>)}</ol>
      <div aria-live="polite" aria-atomic="true"><p className="eyebrow">{step.date} · {index + 1} / {data.steps.length}</p><h3 id="walk-title">{step.title}</h3><p>{step.text}</p></div>
      <div className="walk-sources">{step.sourceIds.map(id => { const source = sources.find(s => s.id === id); return source?.url ? <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a> : null; })}</div>
      <nav aria-label="空间叙事翻步"><button type="button" disabled={index === 0} onClick={() => select(walkIndex(index, "previous", data.steps.length))}>← 上一步</button><button type="button" onClick={close}>结束叙事，返回自由探索</button><button type="button" disabled={index === data.steps.length - 1} onClick={() => select(walkIndex(index, "next", data.steps.length))}>下一步 →</button></nav>
      <p className="walk-keyboard">左右方向键逐步阅读，Home / End 到首末步，Escape 返回。</p>
    </article>}
  </section>;
}
