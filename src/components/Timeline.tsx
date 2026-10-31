import { useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { Period } from "../types/content";
import { clampPeriodIndex, getPeriodRangeValue } from "./timelineModel";
export default function Timeline({
  periods,
  selectedId,
  onSelect,
}: {
  periods: Period[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const ids = periods.map((period) => period.id);
  const selectedIndex = getPeriodRangeValue(selectedId, ids);
  const timelineRef = useRef<HTMLElement>(null);
  const previewIndexRef = useRef(selectedIndex);
  const pointerRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(selectedIndex);
  const [dragging, setDragging] = useState(false);
  const [geometry, setGeometry] = useState({ first: 0, step: 0, left: 0, width: 0 });
  useLayoutEffect(() => {
    const timeline = timelineRef.current;
    if (!timeline) return;
    const measure = () => {
      const dots = [...timeline.querySelectorAll<HTMLElement>(".timeline-dot")];
      if (dots.length < 2) return;
      const bounds = timeline.getBoundingClientRect();
      const centers = dots.map((dot) => {
        const rect = dot.getBoundingClientRect();
        return rect.left + rect.width / 2 - bounds.left;
      });
      const step = (centers.at(-1)! - centers[0]) / (centers.length - 1);
      const next = { first: centers[0], step, left: centers[0] - 22, width: centers.at(-1)! - centers[0] + 44 };
      setGeometry((old) =>
        Math.abs(old.first - next.first) < 0.25 &&
        Math.abs(old.step - next.step) < 0.25 &&
        Math.abs(old.width - next.width) < 0.25
          ? old
          : next,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(timeline);
    timeline.querySelectorAll(".timeline-dot").forEach((dot) => observer.observe(dot));
    return () => observer.disconnect();
  }, [periods.length]);
  useLayoutEffect(() => {
    const pointer = pointerRef.current;
    pointerRef.current = null;
    if (pointer !== null && sliderRef.current?.hasPointerCapture(pointer)) sliderRef.current.releasePointerCapture(pointer);
    setDragging(false);
    setPosition(selectedIndex);
    previewIndexRef.current = selectedIndex;
  }, [selectedIndex]);
  const commit = (value: number) => {
    const index = clampPeriodIndex(value, periods.length);
    const period = periods[index];
    if (period && period.id !== selectedId) onSelect(period.id);
  };
  const setPreview = (value: number) => {
    const bounded = Math.min(Math.max(0, periods.length - 1), Math.max(0, value));
    previewIndexRef.current = bounded;
    setPosition(bounded);
  };
  const pointerPosition = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = timelineRef.current!.getBoundingClientRect();
    return geometry.step > 0 ? (event.clientX - bounds.left - geometry.first) / geometry.step : selectedIndex;
  };
  const finish = (event?: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const pointer = pointerRef.current;
    if (pointer === null || (event && event.pointerId !== pointer)) return;
    const value = cancelled ? selectedIndex : clampPeriodIndex(event ? pointerPosition(event) : previewIndexRef.current, periods.length);
    pointerRef.current = null;
    setDragging(false);
    setPreview(value);
    if (sliderRef.current?.hasPointerCapture(pointer)) sliderRef.current.releasePointerCapture(pointer);
    if (!cancelled) commit(value);
  };
  const previewIndex = clampPeriodIndex(position, periods.length);
  return (
    <nav
      ref={timelineRef}
      className="timeline"
      data-dragging={dragging || undefined}
      aria-label="历史时期选择"
      style={
        {
          "--period-index": position,
          "--period-first": `${geometry.first}px`,
          "--period-step": `${geometry.step}px`,
          "--range-left": `${geometry.left}px`,
          "--range-width": `${geometry.width}px`,
        } as CSSProperties
      }
    >
      <div className="timeline-rail" aria-hidden="true">
        <span className="timeline-cursor" />
        <span className="gilded-light gilded-timeline" aria-hidden="true" />
      </div>
      <div
        ref={sliderRef}
        className="timeline-range-control"
        role="slider"
        tabIndex={0}
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, periods.length - 1)}
        aria-valuenow={previewIndex}
        aria-label="拖动选择历史时期"
        aria-valuetext={periods[previewIndex]?.range + " · " + periods[previewIndex]?.title}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0 || pointerRef.current !== null) return;
          event.preventDefault();
          event.currentTarget.focus({preventScroll:true});
          pointerRef.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
          setPreview(pointerPosition(event));
        }}
        onPointerMove={(event) => {
          if (pointerRef.current === event.pointerId) setPreview(pointerPosition(event));
        }}
        onPointerUp={(event) => finish(event)}
        onPointerCancel={(event) => finish(event, true)}
        onLostPointerCapture={(event) => finish(event, true)}
        onBlur={() => finish(undefined, true)}
        onKeyDown={(event) => {
          if (pointerRef.current !== null) {
            if (event.key === "Escape") { event.preventDefault(); finish(undefined, true); }
            return;
          }
          const value = event.key === "Home" ? 0 : event.key === "End" ? periods.length - 1
            : ["ArrowLeft", "ArrowDown"].includes(event.key) ? previewIndexRef.current - 1
            : ["ArrowRight", "ArrowUp"].includes(event.key) ? previewIndexRef.current + 1 : null;
          if (value === null) return;
          event.preventDefault();
          const index = clampPeriodIndex(value, periods.length);
          setPreview(index);
          commit(index);
        }}
      ><span className="timeline-thumb" aria-hidden="true" /></div>
      {periods.map((period, i) => (
        <button
          key={period.id}
          className={
            "timeline-item " + (selectedId === period.id ? "active" : "")
          }
          aria-pressed={selectedId === period.id}
          data-preview={dragging && previewIndex === i || undefined}
          onClick={() => onSelect(period.id)}
          data-period={period.id}
        >
          <span className="timeline-index">
            0{i + 1}
            <span className="timeline-dot" />
          </span>
          <span className="timeline-range">{period.range}</span>
          <span className="timeline-title">{period.title}</span>
          <span className="timeline-note">{period.note}</span>
        </button>
      ))}
    </nav>
  );
}
