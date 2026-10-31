import { useEffect, useRef } from "react";
import type { MotionDirector } from "../motion/director";
import type { Source } from "../types/content";
import { SourceIcon } from "./Icon";
import { formatSourceLocator, sourceCreator, sourceDate, sourceDisplayType, sourceNote, sourcePublisher, sourceTitle } from "../history/sourcePresentation";

export default function EvidenceDrawer({ director, reduced, open, sources, onClose }: {
  director: MotionDirector; reduced: boolean; open: boolean; sources: Source[]; onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      if (!reduced) void director.play("drawer", [{ element: dialog, keyframes: [{ transform: "translateX(90px) scale(.98)", opacity: 0.5 }, { transform: "none", opacity: 1 }], options: { duration: 340 } }]);
      const before = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { director.cancel("drawer"); dialog.close(); document.body.style.overflow = before; };
    }
    if (dialog.open) dialog.close();
    lastFocus.current?.focus({ preventScroll: true });
    lastFocus.current = null;
  }, [open, director, reduced]);
  return <dialog ref={ref} className="evidence-drawer" aria-labelledby="sources-title"
    onKeyDown={(e) => {
      if (e.key !== "Tab") return;
      const elements = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]')).filter((el) => el.getClientRects().length > 0);
      const first = elements[0], last = elements.at(-1);
      if (!first || !last) { e.preventDefault(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }}
    onCancel={(e) => { e.preventDefault(); onClose(); }}
    onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); if (e.target === e.currentTarget && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) onClose(); }}>
    <div className="drawer-header">
      <div><p className="eyebrow">史料说明 / SOURCE NOTE</p><h2 id="sources-title">这份档案的出处</h2></div>
      <button className="close-button" onClick={onClose} aria-label="关闭史料说明" autoFocus>×</button>
    </div>
    <p className="drawer-intro">这里保留本页所依据的书刊、档案和公开校史页面，方便沿线索继续阅读。</p>
    {sources.length ? sources.map((source) => <article key={source.id} className="source-card">
      <p className="source-index"><SourceIcon /> {source.isMock ? "示例资料" : "文献出处"}</p>
      <h3>{sourceTitle(source.title)}</h3>
      <dl>
        {sourceCreator(source) && <div><dt>作者或整理者</dt><dd>{sourceCreator(source)}</dd></div>}
        {sourcePublisher(source) && <div><dt>出处机构</dt><dd>{sourcePublisher(source)}</dd></div>}
        {sourceDate(source) && <div><dt>刊载时间</dt><dd>{sourceDate(source)}</dd></div>}
        {source.url && <div><dt>出处页面</dt><dd><a href={source.url} target="_blank" rel="noopener noreferrer">打开出处页面 ↗</a></dd></div>}
        {formatSourceLocator(source.locator) && <div><dt>原件位置</dt><dd>{formatSourceLocator(source.locator)}</dd></div>}
        <div><dt>资料类型</dt><dd>{sourceDisplayType(source.sourceType)}</dd></div>
        {sourceNote(source) && <div><dt>说明</dt><dd>{sourceNote(source)}</dd></div>}
      </dl>
    </article>) : <p>目前没有单列的书目或网页出处。</p>}
    <p className="drawer-note">来源链接和文献定位随档案保留，便于继续查阅。</p>
    <button className="button button-dark drawer-return" onClick={onClose}>返回事件档案</button>
  </dialog>;
}
