import type { Place, Period, Relation, HistoryEvent, Source } from "../types/content";
import { useEffect, useRef, type CSSProperties } from "react";
import AtlasPaper from "./AtlasPaper";
import historyCopy from "../history/copy";
import { relationPresentation, viewRelations, type MapViewMode } from "../history/mapView";
import "../stage02-map.css";
import { microLayout, microThreads } from "../history/mapMicroPresentation";
import "../stage05f-map.css";

function relationClass(relation: Relation) {
  if (relation.kind === "organization-link") return "organization";
  if (relation.subtype === "planned-relocation") return "planned";
  if (relation.subtype === "dispersed-schooling") return "dispersed";
  return "travel";
}

export default function HistoryMap({
  places,
  selectedId,
  isDemo,
  isHistoryPreview,
  isSyntheticTest = false,
  relations,
  period,
  onSelect,
  viewMode,
  availablePlaceIds,
  events = [],
  sources = [],
  onEvent,
}: {
  places: Place[];
  selectedId: string | null;
  isDemo: boolean;
  isHistoryPreview: boolean;
  isSyntheticTest?: boolean;
  relations: Relation[];
  period: Period;
  onSelect: (id: string) => void;
  viewMode?: MapViewMode;
  availablePlaceIds?: string[];
  events?: HistoryEvent[];
  sources?: Source[];
  onEvent?: (id: string) => void;
}) {
  const micro = !isDemo && !isHistoryPreview && !isSyntheticTest && (period.id === "p1924" || period.id === "p1927" || period.id === "p1947");
  const surface = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = surface.current;
    if (!micro || !element) return;
    let visible = false;
    const update = () => { element.dataset.mapMotion = visible && !document.hidden ? "running" : "paused"; };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); delete element.dataset.mapMotion; };
  }, [micro, period.id]);
  places = places.map(place => {
    const layout = micro ? microLayout(period.id, place.id) : undefined;
    return { ...place, schematic: layout ? { x: layout.x, y: layout.y } : place.periodLayouts?.[period.id] ?? place.schematic };
  });
  const threads = micro ? microThreads(period.id, places) : [];
  const activeView = period.id === "p1938" ? viewMode : undefined;
  const selectedPlace = places.find(place => place.id === selectedId);
  const placeById = new Map(places.map((place) => [place.id, place]));
  const visibleRelations = relations.filter(
    (relation) => placeById.has(relation.fromPlaceId) && placeById.has(relation.toPlaceId),
  );
  const activeRelations = new Set(viewRelations(visibleRelations, activeView).map((relation) => relation.id));
  // The parent supplies relevant event places; relation-only references remain usable.
  const available = new Set([
    ...(availablePlaceIds ?? places.map((place) => place.id)),
    ...visibleRelations.filter((relation) => activeRelations.has(relation.id))
      .flatMap((relation) => [relation.fromPlaceId, relation.toPlaceId]),
  ]);
  const availableCount = activeView ? places.filter((place) => available.has(place.id)).length : places.length;
  return (
    <section className="map-card" data-map-view={activeView} data-map-period={period.id} aria-labelledby="map-title">
      <div className="map-heading">
        <div>
          <p className="eyebrow">地点索引 / PLACE INDEX</p>
          <h3 id="map-title">在地图上，寻找线索</h3>
        </div>
        <span className="schematic-badge">示意地图</span>
      </div>
      {activeView && (
        <p className="map-view-caption" role="status">
          <strong>{activeView === "school" ? "学校迁校" : "红色组织活动"}</strong>
          <span>同一时空，{activeView === "school" ? "阅读办学足迹" : "阅读组织线索"}；淡线保留另一视角的参照。</span>
        </p>
      )}
      <div className="map-period-caption">
        <span>{period.range}</span>
        <span>{period.title}</span>
      </div>
      <p className="map-disclaimer">
        {isSyntheticTest ? "TEST ONLY · 合成示意图，不代表历史事实。" : "示意图，不代表精确历史地理位置及实际行进路线。"}
        {isDemo
          ? "时期与地点的匹配为 MOCK，非历史迁校或活动结论。"
          : isHistoryPreview
            ? historyCopy.mapDisclaimer
            : "地点依据关联史料展示；示意位置不代表精确坐标。"}
      </p>
      <div ref={surface} className="map-surface" data-map-micro={micro ? "true" : undefined} role="group" aria-label="示意地图地点选择">
        <span className="gilded-light gilded-map" aria-hidden="true" />
        <div className="atlas-camera">
          <AtlasPaper year={period.range} />
        </div>
        {micro && <svg className="map-micro-threads" viewBox="0 0 720 470" preserveAspectRatio="none" aria-hidden="true">
          {threads.map((thread, index) => <g key={thread.id} data-thread-kind={thread.kind}
            data-thread-from={thread.from} data-thread-to={thread.to}
            data-linked={selectedId === thread.from || selectedId === thread.to}
            style={{ "--map-phase": `${-index * 1.1}s` } as CSSProperties}>
            <path className="map-thread-ink" d={thread.path} />
            <path className="map-thread-current" d={thread.path} />
          </g>)}
        </svg>}
        {visibleRelations.length > 0 && (
          <svg className="map-relations" viewBox="0 0 720 470" preserveAspectRatio="none" aria-hidden="true">
            {visibleRelations.map((relation) => {
              const from = placeById.get(relation.fromPlaceId)!;
              const to = placeById.get(relation.toPlaceId)!;
              const presentation = relationPresentation(relation);
              const active = activeRelations.has(relation.id);
              return (
                <g key={relation.id}
                  data-relation={relation.id}
                  data-active={active}
                  data-occurred={relation.occurred}
                  data-render-as-travel={relation.renderAsTravel}
                  className={"map-relation " + (activeView ? presentation.className : relationClass(relation))}>
                  <line x1={from.schematic.x} y1={from.schematic.y} x2={to.schematic.x} y2={to.schematic.y} />
                  <title>{`${from.name} — ${to.name}：${presentation.label}${relation.statusNote ? "；" + relation.statusNote : ""}`}</title>
                </g>
              );
            })}
          </svg>
        )}
        {places.map((place, index) => (
          <button
            key={place.id}
            data-place={place.id}
            data-map-weight={micro ? microLayout(period.id, place.id)?.weight ?? "secondary" : undefined}
            data-map-label={micro ? microLayout(period.id, place.id)?.label ?? "below" : undefined}
            data-active={!activeView || available.has(place.id)}
            className={
              "map-node " + (selectedId === place.id && (!activeView || available.has(place.id)) ? "selected" : "")
            }
            style={{
              left: (place.schematic.x / 720) * 100 + "%",
              top: (place.schematic.y / 470) * 100 + "%",
              ...(micro ? { "--map-phase": `${-index * .85}s` } : {}),
            } as CSSProperties}
            aria-label={
              place.name + (isDemo ? "，MOCK 演示地点" : activeView && !available.has(place.id) ? "，当前视角无关联档案或关系，仅作参照" : "，选择地点")
            }
            aria-pressed={selectedId === place.id && (!activeView || available.has(place.id))}
            disabled={!!activeView && !available.has(place.id)}
            onClick={() => onSelect(place.id)}
          >
            <span className="node-target">
              <span className="node-dot" />
            </span>
            <span className="node-label">
              {place.name}
              {isDemo && <small>MOCK</small>}
            </span>
          </button>
        ))}
        {places.length === 0 && (
          <div className="map-empty">
            <span className="empty-symbol">＋</span>
            <strong>等待史料落点</strong>
            <p>{isHistoryPreview ? historyCopy.mapEmpty : "这一章节还没有审核通过的地点资料。"}</p>
          </div>
        )}
        {places.length === 1 && (
          <div className="map-margin-note" aria-hidden="true">
            每一个地点，
            <br />
            都是一份档案的入口。
          </div>
        )}
      </div>
      {selectedPlace?.description && <section className="map-place-reading" aria-label="地点史料说明" aria-live="polite">
        <p className="eyebrow">{selectedPlace.locationPrecision === "campus" ? "校园范围" : selectedPlace.locationPrecision === "city" ? "城市层级" : selectedPlace.placeType === "street" ? "街道与地点示意" : "历史场所示意"}</p>
        <h4>{selectedPlace.name}</h4><p>{selectedPlace.description}</p>
        <div>{selectedPlace.sourceIds?.map(id => { const source = sources.find(s => s.id === id); return source?.url ? <a key={id} href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a> : null; })}</div>
        {onEvent && <ul>{events.filter(item => item.placeIds.includes(selectedPlace.id)).map(item => <li key={item.id}><button type="button" onClick={() => onEvent(item.id)}>{item.title} →</button></li>)}</ul>}
      </section>}
      {activeView && visibleRelations.length > 0 ? (
        <div className="map-legend map-view-legend" aria-label="关系图例，均为示意关系">
          {Array.from(new Map(visibleRelations.map((relation) => {
            const presentation = relationPresentation(relation);
            return [presentation.className, presentation] as const;
          })).values()).map(({ className, label }) => (
            <span key={className} className={"relation-legend " + className}>
              <svg viewBox="0 0 40 8" aria-hidden="true"><line x1="0" y1="4" x2="40" y2="4" /></svg>
              {label}
            </span>
          ))}
        </div>
      ) : isHistoryPreview && visibleRelations.length > 0 && (
        <div className="map-legend" aria-label="关系图例">
          {[
            ["travel", "实际关系"],
            ["planned", "计划迁校"],
            ["dispersed", "分散办学"],
            ["organization", "组织联系"],
          ].map(([kind, label]) => (
            <span key={kind} className={"relation-legend " + kind}>
              <i /> {label}
            </span>
          ))}
        </div>
      )}
      {activeView && visibleRelations.length > 0 && (
        <details className="map-relation-index">
          <summary>关系文字索引 · {viewRelations(visibleRelations, activeView).length} 条当前线索</summary>
          <ul>{visibleRelations.map((relation) => (
            <li key={relation.id} data-active={activeRelations.has(relation.id)}>
              {placeById.get(relation.fromPlaceId)!.name} — {placeById.get(relation.toPlaceId)!.name}：
              {relationPresentation(relation).label}
              {!activeRelations.has(relation.id) && "（另一视角参照）"}
              {relation.statusNote && "；" + relation.statusNote}
            </li>
          ))}</ul>
        </details>
      )}
      <div className="map-footer">
        <span>
          <i className="legend-dot" />
          {isDemo ? "MOCK 演示节点" : isHistoryPreview ? historyCopy.mapFooter : "史料关联地点"}
        </span>
        <span>
          {activeView ? `${availableCount} / ${places.length} 个当前可用地点` : `${places.length} 个${isDemo ? "演示" : "可用"}地点`} · 点击查看档案
        </span>
      </div>
    </section>
  );
}
