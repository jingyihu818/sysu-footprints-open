import { useEffect, useRef, useState } from "react";
import type { HistoricalImage } from "../history/media";
import "../stage02-media.css";
const categoryLabels: Record<string,string> = {
  "historical-photo":"历史照片", "modern-site-photo":"当代遗址／纪念场馆照片",
  "newspaper-scan":"报刊扫描", "distribution-diagram":"分布资料图 · 制作年代未明",
  "historical-document":"文献影像",
  "historical-photograph":"历史照片", "periodical-scan":"报刊扫描", "site-photograph":"当代遗址照片", "modern-exhibition":"当代展陈照片",
};

function DocumentImage({ image, large = false }: { image: HistoricalImage; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="historical-image-error" role="status">图像暂时无法加载。可从图注下方打开原始来源。</div>
  ) : <img src={large ? image.displayUrl : image.thumbnailUrl}
    width={image.width} height={image.height} alt={image.alt}
    loading="eager" fetchPriority={large ? "high" : "auto"} decoding="async" onError={() => setFailed(true)} />;
}

export default function HistoricalMedia({ images, onOpen, onSources }: {
  images: HistoricalImage[];
  onOpen: (id: string) => void;
  onSources: (ids: string[]) => void;
}) {
  return <section className="historical-media" aria-label="关联史料影像">
    <h4>史料影像 <span>{images.length ? `${images.length} 件附页` : "尚无适用影像"}</span></h4>
    {images.length ? <div className="historical-media-grid">{images.map(image => <figure key={image.id} data-media-id={image.id}>
      <button className="historical-thumbnail" onClick={() => onOpen(image.id)} aria-label={`放大查看：${image.title}`} aria-haspopup="dialog">
        <DocumentImage image={image} /><span>展开原图</span>
      </button>
      <figcaption><strong>{image.title}</strong>
        <small>{categoryLabels[image.imageCategory] ?? "史料附页"}</small>
        <span>{image.caption ?? `图像说明：${image.alt}`}</span>
        <small>{image.rightsLabel}</small>
        <button className="historical-source" onClick={() => onSources(image.sourceIds)}>图像出处</button>
      </figcaption>
    </figure>)}</div> : <p className="historical-media-empty">正文与来源可独立阅读；更多影像可从文献来源中查阅。</p>}
  </section>;
}

export function HistoricalMediaViewer({ images, selectedId, onSelect, onClose, onSources }: {
  images: HistoricalImage[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
  onSources: (ids: string[]) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const selected = images.findIndex(image => image.id === selectedId);
  const image = images[selected];
  const open = Boolean(image);
  useEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = before;
      const target = lastFocus.current;
      if (target?.isConnected) target.focus({preventScroll: true});
      else document.getElementById("event-panel-title")?.focus({preventScroll: true});
    };
  }, [open]);
  function step(delta: number) {
    if(images.length > 1) onSelect(images[(selected + delta + images.length) % images.length].id);
  }
  return <dialog ref={dialog} className="historical-viewer" aria-labelledby="historical-viewer-title"
    onCancel={e => {e.preventDefault(); onClose();}}
    onClick={e => {const r=e.currentTarget.getBoundingClientRect(); if(e.target===e.currentTarget && (e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)) onClose();}}
    onKeyDown={e => {
      if(e.key === "ArrowLeft") {e.preventDefault(); step(-1);}
      if(e.key === "ArrowRight") {e.preventDefault(); step(1);}
      if(e.key !== "Tab") return;
      const elements=Array.from(e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]')).filter(el=>el.getClientRects().length);
      const first=elements[0],last=elements.at(-1);
      if(e.shiftKey && document.activeElement===first) {e.preventDefault();last?.focus();}
      if(!e.shiftKey && document.activeElement===last) {e.preventDefault();first?.focus();}
    }}>
    {image && <>
      <header className="historical-viewer-header"><div><p>史料图像 · {selected + 1} / {images.length}</p><h2 id="historical-viewer-title">{image.title}</h2></div>
        <button className="close-button" autoFocus onClick={onClose} aria-label="关闭影像阅览">×</button></header>
      <div className="historical-viewer-image"><DocumentImage key={image.id} image={image} large /></div>
      <div className="historical-viewer-caption">
        <p>{image.caption ?? `图像说明：${image.alt}`}</p>
        <p>{categoryLabels[image.imageCategory] ?? "史料附页"}</p>
        {image.historicalDate && <p>图像年代：{image.historicalDate}</p>}
        {image.originInstitution && <p>{image.originInstitution}{image.width && image.height ? " · 原始尺寸 " + image.width + " × " + image.height : ""}</p>}
        {image.width !== undefined && image.width < 650 && <p>现有图像清晰度有限，仅供辨识；放大不会增加原始细节。</p>}
        <p className="historical-rights">{image.rightsLabel}</p>
        <div className="historical-viewer-actions">
          <button onClick={() => step(-1)} disabled={images.length < 2}>上一张</button>
          <button onClick={() => step(1)} disabled={images.length < 2}>下一张</button>
          <button onClick={() => onSources(image.sourceIds)}>查看图像出处</button>
          {image.originalPageUrl && <a href={image.originalPageUrl} target="_blank" rel="noopener noreferrer">打开出处页面 ↗</a>}
        </div>
      </div>
    </>}
  </dialog>;
}
