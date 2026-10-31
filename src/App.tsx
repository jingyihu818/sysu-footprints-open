import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { MotionDirector } from "./motion/director";
import {
  useSystemReducedMotion,
  isConstrainedDevice,
} from "./motion/useMotionPreference";
import { useCinematicScenes, landInExplorer } from "./motion/useCinematicScenes";
import { useAtmosphere } from "./motion/useAtmosphere";
import { useGildedLight } from "./motion/useGildedLight";
import ContinuityAtlas from "./components/ContinuityAtlas";
import { content, isDemo, isHistoryPreview } from "virtual:history-content";
import { historyPreview, exhibitionExtensions, isStage04aTest } from "virtual:history-preview";
import { toHistoryUiBundle, type HistoryPreviewBundle } from "./history/adapter";
import historyCopy from "./history/copy";
import { periods, site } from "./config/site";
import { explorerReducer, initialState, type ExplorerState } from "./state/explorer";
import Hero from "./components/Hero";
import Timeline from "./components/Timeline";
import HistoryMap from "./components/HistoryMap";
import EventPanel from "./components/EventPanel";
import EvidenceDrawer from "./components/EvidenceDrawer";
import ContemporarySection from "./components/ContemporarySection";
import { Arrow } from "./components/Icon";
import AmbientMeteors from "./components/AmbientMeteors";
import HistoricalMedia, { HistoricalMediaViewer } from "./components/HistoricalMedia";
import HistoricalDossier from "./components/HistoricalDossier";
import ChapterEvidencePreview from "./components/ChapterEvidencePreview";
import { viewEvents, viewRelations, selectionForView, type MapViewMode } from "./history/mapView";
import type { HistoryEvent } from "./types/content";
import type { HistoricalImage } from "./history/media";
import { buildRecommendedRoute, type RecommendedRouteStep } from "./history/recommendedRoute";
import RecommendedRoute from "./components/RecommendedRoute";
import ResearchShelf from "./components/ResearchShelf";
import { pauseTeamAudio, setIntroBlocking } from "./team/audioFocus";
import IntroSequence from "./components/IntroSequence";
import { introConfig } from "virtual:intro-config";
import CentennialExhibit from "./components/CentennialExhibit";
import HistoryWalk from "./components/HistoryWalk";
import { centennialData, walkData } from "virtual:stage07-reading-content";
import MusicPlayer from "./audio/MusicPlayer";
export default function App() {
  const preview = isHistoryPreview
    ? (historyPreview as HistoryPreviewBundle)
    : null;
  const research = preview?.research ?? null;
  const stateFromLocation = (seed: ExplorerState) => {
    if (new URLSearchParams(window.location.search).get("chapter") === "p2026" || window.location.hash === "#contemporary") return { ...seed, periodId: "p2026" };
    const params = new URLSearchParams(window.location.search);
    const chapter = params.get("chapter");
    if (!(preview?.chapters ?? periods).some(item=>item.id===chapter)) return seed;
    const viewMode = params.get("view") === "organization" ? "organization" as const : "school" as const;
    const events = viewEvents((preview?.events ?? content.events).filter(item=>item.periodId===chapter),chapter==="p1938" ? viewMode : undefined);
    const place = params.get("place");
    const placeId = place && events.some(item=>item.placeIds.includes(place)) ? place : null;
    let eventId = events.find(item=>item.id===params.get("event") && (!placeId||item.placeIds.includes(placeId)))?.id ?? null;
    if(placeId && !eventId) eventId = selectionForView(events,chapter==="p1938" ? viewMode : undefined,placeId,null).eventId;
    const requestedPage = Number(params.get("dossier"));
    const dossier = (preview?.dossiers ?? exhibitionExtensions.dossiers).find(item=>item.periodId===chapter);
    const dossierPage = params.has("dossier") && dossier && Number.isInteger(requestedPage) && requestedPage>=1 && requestedPage<=dossier.pages.length ? requestedPage-1 : null;
    if(dossierPage !== null) eventId = dossier!.pages[dossierPage].eventIds[0] ?? null;
    return {...seed,periodId:chapter!,viewMode,placeId:dossierPage!==null?null:placeId,eventId,dossierPage};
  };
  const [state, dispatch] = useReducer(explorerReducer, initialState, stateFromLocation);
  const [routeOpen, setRouteOpen] = useState(false);
  const formal = !isDemo && !isHistoryPreview && !isStage04aTest;
  const [centennialOpen, setCentennialOpen] = useState(formal && new URLSearchParams(location.search).get("feature") === "centennial");
  function selectionUrl() {
    const url = new URL(location.href);
    for (const key of ["feature", "event", "place", "view", "dossier"]) url.searchParams.delete(key);
    url.searchParams.set("chapter", state.periodId);
    if (state.eventId) url.searchParams.set("event", state.eventId);
    if (state.placeId) url.searchParams.set("place", state.placeId);
    if (state.periodId === "p1938") url.searchParams.set("view", state.viewMode);
    if (state.dossierPage !== null) url.searchParams.set("dossier", String(state.dossierPage + 1));
    if (state.periodId !== "p2026") url.searchParams.delete("member");
    url.hash = state.periodId === "p2026" ? "contemporary" : "explore";
    return url;
  }
  function openCentennial() {
    pauseTeamAudio();
    const url = selectionUrl();
    history.replaceState(null, "", url);
    url.searchParams.set("feature", "centennial"); url.hash = "centennial";
    history.pushState(null, "", url); setCentennialOpen(true);
  }
  function closeCentennial() {
    const url = new URL(location.href); url.searchParams.delete("feature"); url.hash = state.periodId === "p2026" ? "contemporary" : "explore";
    history.replaceState(null, "", url); setCentennialOpen(false);
  }
  const [introReplay, setIntroReplay] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const guideDialog = useRef<HTMLDialogElement>(null);
  const guideReturnFocus = useRef<HTMLElement | null>(null);
  const uiContent = useMemo(
    () => (preview ? toHistoryUiBundle(preview) : content),
    [preview],
  );
  const visiblePeriods = useMemo(
    () =>
      preview
        ? preview.chapters.map(({ id, range, title, note }) => ({
            id,
            range,
            title,
            note,
          }))
        : periods.map(item => ({ ...item, note: isDemo ? item.note : item.id === "p2026" ? "九人共同创作" : `${uiContent.events.filter(event => event.periodId === item.id).length} 份历史档案` })),
    [preview, uiContent],
  );
  const period = visiblePeriods.find((p) => p.id === state.periodId) ?? visiblePeriods[0];
  const periodEvents = useMemo(
    () => uiContent.events.filter((e) => e.periodId === period.id),
    [period.id, uiContent.events],
  );
  const periodRelations = useMemo(() => uiContent.relations.filter((relation) => relation.periodId === period.id),[uiContent.relations,period.id]);
  const placeIds = useMemo(() => new Set([
    ...periodEvents.flatMap((e) => e.placeIds),
    ...periodRelations.flatMap((relation) => [relation.fromPlaceId, relation.toPlaceId]),
  ]),[periodEvents,periodRelations]);
  const visiblePlaces = useMemo(
    () => uiContent.places.filter((p) => placeIds.has(p.id)),
    [placeIds, uiContent.places],
  );
  const hasDualViews = period.id === "p1938" && periodEvents.some((item) => item.viewModes?.includes("school") || item.viewModes?.includes("organization"));
  const activeView = period.id === "p1938" && (isHistoryPreview || hasDualViews) ? state.viewMode : undefined;
  const viewFilteredEvents = viewEvents(periodEvents, activeView);
  const activeRelations = viewRelations(periodRelations, activeView);
  const availablePlaceIds = [...new Set([...viewFilteredEvents.flatMap(e=>e.placeIds),...activeRelations.flatMap(r=>[r.fromPlaceId,r.toPlaceId])])];
  const visibleEvents = state.placeId
    ? viewFilteredEvents.filter((e) => e.placeIds.includes(state.placeId!))
    : viewFilteredEvents;
  const event = visibleEvents.find((e) => e.id === state.eventId) ?? null;
  const sources = event
    ? uiContent.sources.filter((s) => (state.sourceIds ?? event.sourceIds).includes(s.id))
    : [];
  const images: HistoricalImage[] = preview?.images ?? uiContent.events.flatMap((item) => item.media.filter((media) => media.type === "image").map((media) => ({
    id: media.id, relatedEventIds: [item.id], sourceIds: [media.sourceId], title: media.title ?? media.alt, caption: media.caption ?? media.alt, alt: media.alt, historicalDate: media.historicalDate ?? null, imageCategory: media.imageCategory ?? "historical-document", rightsStatus: "approved", rightsLabel: media.rights, originInstitution: media.originInstitution ?? null, originalPageUrl: media.originalPageUrl ?? uiContent.sources.find((source) => source.id === media.sourceId)?.url ?? null, width: media.width, height: media.height, thumbnailUrl: import.meta.env.BASE_URL + media.path, displayUrl: import.meta.env.BASE_URL + media.path,
  })));
  const eventImages = event ? images.filter(image => image.relatedEventIds.includes(event.id)) : [];
  const dossier = (preview?.dossiers ?? exhibitionExtensions.dossiers).find(item=>item.periodId === period.id);
  const dossierOpen = Boolean(dossier && state.dossierPage !== null);
  const dossierTrigger = useRef<HTMLButtonElement>(null);
  const selectPeriod = (periodId: string) => {
    const editingTimeline = document.activeElement?.classList.contains("timeline-range-control");
    pauseTeamAudio();
    const url = new URL(window.location.href);
    const previousChapter = url.searchParams.get("chapter");
    const leavingMember = url.searchParams.has("member") && periodId !== "p2026";
    url.searchParams.set("chapter", periodId);
    for (const key of ["event", "place", "view", "dossier"]) url.searchParams.delete(key);
    if (periodId !== "p2026") url.searchParams.delete("member");
    url.hash = periodId === "p2026" ? "contemporary" : "explore";
    if (leavingMember || previousChapter !== periodId) window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
    scenes.act({ type: "PERIOD", periodId });
    requestAnimationFrame(() => {
      // A range remains a range while using successive Home/End/Arrow keys.
      if (editingTimeline) return;
      const target = document.getElementById(periodId === "p2026" ? "contemporary-title" : "explore-title");
      target?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
      target?.focus({ preventScroll: true });
    });
  };
  const recommendedRoute = buildRecommendedRoute({
    schoolEventId: uiContent.events.find((item) => item.periodId === "p1938" && item.viewModes?.includes("school"))?.id ?? null,
    imageId: images[0]?.id ?? null,
    imageEventId: images[0]?.relatedEventIds[0] ?? null,
    organizationEventId: uiContent.events.find((item) => item.periodId === "p1938" && item.viewModes?.includes("organization"))?.id ?? null,
    dossierAvailable: Boolean((preview?.dossiers ?? exhibitionExtensions.dossiers).some((item) => item.periodId === "p1947")),
  });
  const handleRecommendedStep = (step: RecommendedRouteStep) => {
    if (step.id === "home") { document.getElementById("home")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" }); return; }
    if (step.id === "ending") { selectPeriod("p2026"); return; }
    if (step.id === "dossier") { selectPeriod("p1947"); return; }
    if (step.id === "organization") { selectPeriod("p1938"); requestAnimationFrame(() => changeView("organization")); return; }
    if (step.id === "map" || step.id === "archive" || step.id === "image") { selectPeriod("p1938"); requestAnimationFrame(() => { if (step.target) scenes.act({ type: "EVENT", eventId: step.target }); }); }
  };
  useEffect(() => {
    if (dossierOpen) document.querySelector<HTMLElement>(".historical-dossier")?.focus({preventScroll:true});
  }, [dossierOpen]);
  useEffect(() => {
    const dialog = guideDialog.current;
    if (!dialog) return;
    if (guideOpen && !dialog.open) dialog.showModal();
    if (!guideOpen && dialog.open) dialog.close();
  }, [guideOpen]);
  useEffect(() => {
    const dialog = guideDialog.current;
    if (!dialog) return;
    const onClose = () => {
      setGuideOpen(false);
      requestAnimationFrame(() => guideReturnFocus.current?.focus());
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);
  useEffect(() => {
    // Nested native dialogs restore their own focus; once both close, release any nested scroll lock.
    if (!state.drawerOpen && !state.mediaId) document.body.style.overflow = "";
  }, [state.drawerOpen,state.mediaId]);
  useEffect(() => {
    const onPop = () => {
      setCentennialOpen(formal && new URLSearchParams(location.search).get("feature") === "centennial");
      dispatch({ type: "RESTORE", state: stateFromLocation(initialState) });
      pauseTeamAudio();
    };
    window.addEventListener("popstate", onPop);
    if (new URLSearchParams(location.search).get("chapter") === "p2026" || location.hash === "#contemporary") requestAnimationFrame(() => {
      if (!document.querySelector(".member-dossier")) document.getElementById("contemporary-title")?.scrollIntoView({ block: "start" });
    });
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    if (window.location.hash === "#explore") {
      requestAnimationFrame(()=>{
        const timeline = document.querySelector<HTMLElement>(".timeline");
        const active = timeline?.querySelector<HTMLElement>(".timeline-item.active");
        if(timeline && active && timeline.scrollWidth>timeline.clientWidth) timeline.scrollLeft=active.offsetLeft-timeline.clientWidth/2+active.clientWidth/2;
        const root = document.querySelector(".film-shell");
        if (root) landInExplorer(root, state.eventId ? "start" : "free");
      });
    }
  }, []);
  const shell = useRef<HTMLDivElement>(null),
    portal = useRef<HTMLDivElement>(null);
  const director = useRef(new MotionDirector()).current;
  const systemReduced = useSystemReducedMotion();
  const [userReduced, setUserReduced] = useState(false);
  const constrained = useMemo(isConstrainedDevice, []);
  const reduced = systemReduced || userReduced || constrained;
  const scenes = useCinematicScenes({
    shell,
    portal,
    director,
    reduced,
    periodIndex: visiblePeriods.findIndex((p) => p.id === period.id),
    eventId: state.eventId,
    places: visiblePlaces,
    dispatch,
    entryTargets: {
      start: { periodId: uiContent.events[0]?.periodId ?? "p1924", eventId: uiContent.events[0]?.id ?? null },
      free: { periodId: uiContent.events.find(item => item.periodId === "p1938" && item.placeIds.length > 0)?.periodId ?? uiContent.events.find(item => item.placeIds.length > 0)?.periodId ?? "p1924", eventId: null },
    },
  });
  useAtmosphere(shell, director, reduced);
  useGildedLight({ shell, director, reduced, periodIndex: visiblePeriods.findIndex(p => p.id === period.id), eventId: state.eventId });
  function changeView(viewMode: MapViewMode) {
    const selection = selectionForView(periodEvents,viewMode,state.placeId,state.eventId);
    scenes.act({type:"VIEW",viewMode,...selection});
  }
  function openGuide(target: HTMLElement) {
    guideReturnFocus.current = target;
    setGuideOpen(true);
  }
  const renderMedia = (item: HistoryEvent) => <HistoricalMedia
    images={images.filter(image=>image.relatedEventIds.includes(item.id))}
    onOpen={mediaId=>dispatch({type:"OPEN_MEDIA",mediaId})}
    onSources={sourceIds=>dispatch({type:"OPEN_SOURCE",sourceIds})} />;
  function dossierPage(index: number) {
    const page = dossier?.pages[index];
    if(page?.eventIds[0]) dispatch({type:"DOSSIER_PAGE",pageIndex:index,eventId:page.eventIds[0]});
  }
  function openRecord(eventId: string) {
    const item = uiContent.events.find(record => record.id === eventId);
    if (!item) return;
    pauseTeamAudio(); setCentennialOpen(false);
    const url = selectionUrl(); history.replaceState(null,"",url);
    for (const key of ["place", "view", "dossier", "member"]) url.searchParams.delete(key);
    url.searchParams.set("chapter",item.periodId); url.searchParams.set("event",eventId); url.hash="explore";
    history.pushState(null,"",url);
    dispatch({type:"PERIOD",periodId:item.periodId}); dispatch({type:"EVENT",eventId});
    requestAnimationFrame(() => { const title=document.getElementById("event-panel-title");title?.scrollIntoView({block:"start",behavior:reduced?"auto":"smooth"});title?.focus({preventScroll:true}); });
  }
  return (
    <div
      ref={shell}
      className="film-shell"
      data-motion={reduced ? "reduced" : "full"}
      data-gilded="A"
      data-gilded-final="true"
    >
      <a className="skip-link" href="#explore">
        跳到探索区域
      </a>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="足迹学生学习小组作品，返回首页；非中山大学官方网站">
          <span className="brand-seal">足</span>
          <img className="university-seal" src="./sysu-emblem-red.png" alt="中山大学红色校徽" />
          <strong>足迹</strong>
          <span className="brand-description">学生学习小组作品 · 非官方网站</span>
        </a>
        <nav aria-label="页面导航">
          <a href="#explore">历史探索</a>
          {formal && <a href="?feature=centennial#centennial" onClick={event => { event.preventDefault(); openCentennial(); }}>百年回望</a>}
          <a href="#contemporary" onClick={(event) => { event.preventDefault(); selectPeriod("p2026"); }}>当代与我们</a>
        </nav>
        <button
          className="guide-trigger"
          type="button"
          onClick={(event) => openGuide(event.currentTarget)}
          aria-haspopup="dialog"
        >
          探索指南
        </button>
        <button
          className="motion-preference"
          aria-pressed={userReduced || systemReduced || constrained}
          onClick={() => {
            scenes.skip();
            setUserReduced((value) => !value);
          }}
        >
          {systemReduced || constrained
            ? "静态浏览"
            : userReduced
              ? "恢复动效"
              : "减少动效"}
        </button>
      </header>
      <dialog
        ref={guideDialog}
        className="exploration-guide"
        aria-labelledby="exploration-guide-title"
        onCancel={() => setGuideOpen(false)}
      >
        <div className="guide-heading">
          <div>
            <p className="eyebrow">READING GUIDE / 探索指南</p>
            <h2 id="exploration-guide-title">怎样走近这张地图</h2>
          </div>
          <button className="guide-close" type="button" onClick={() => setGuideOpen(false)} aria-label="关闭探索指南">×</button>
        </div>
        <p className="guide-intro">按自己的节奏阅读：可以沿建议路径进入，也可以直接选择时间、地点和档案。</p>
        <p className="guide-status" role="note">
          {isStage04aTest ? "当前为 TEST ONLY 合成展陈测试，不代表历史事实或正式内容。" : isDemo ? "当前为 MOCK 交互演示，事件、来源和地点匹配不构成历史事实。" : isHistoryPreview ? "当前为历史内部预览；页面中的内容和关系仍以来源核验与内部审查边界为准。" : "历史篇章可按时间、地点与专题阅读；九位共同创作者的文字与声音收录在当代终章。"}
        </p>
        <ol className="guide-steps">
          <li><strong>从首页开始</strong><span>点击“开始探索”进入建议路径，或点击“自由探索”直接进入地图。</span></li>
          <li><strong>按时间选择章节</strong><span>在时间轴上选择时期；章节标注说明当前是规划入口还是可阅读档案。</span></li>
          <li><strong>打开地点与事件</strong><span>选择地图地点或事件目录，在档案面板阅读文字、媒体和关联来源。</span></li>
          <li><strong>继续查看出处</strong><span>在档案面板点击“查看出处”，可打开史料说明；图片加载失败时仍可从图注进入出处页面。</span></li>
          <li><strong>走到当代终章</strong><span>从页头“当代与我们”进入团队区域；成员文字、声音和影像按各自公开范围呈现。</span></li>
        </ol>
        <div className="guide-footer">
          <span>键盘提示：Tab 移动焦点，Escape 关闭本指南。</span>
          <button className="button button-dark" type="button" onClick={() => setGuideOpen(false)}>开始阅读</button>
        </div>
      </dialog>
      <main>
        <Hero
          isDemo={isDemo}
          isHistoryPreview={isHistoryPreview}
          isSyntheticTest={isStage04aTest}
          places={visiblePlaces}
          year={period.range}
          onEnter={scenes.enter}
          onOpenGuide={openGuide}
          onReplayIntro={introConfig.enabled ? () => { setIntroBlocking(!reduced); pauseTeamAudio(); scenes.home(); setIntroReplay(value => value + 1); } : undefined}
        />
        <section
          className="explore section-wrap"
          id="explore"
          aria-labelledby="explore-title"
        >
          <AmbientMeteors />
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / 历史探索</p>
              <h2 id="explore-title" tabIndex={-1}>
                循着时间，寻找足迹。
              </h2>
            </div>
            <p>
              选择一个时期，再走近一个地点。
              <br />
              让每一段记忆有据可循。
            </p>
          </div>
          <div
            className={"content-notice " + (isDemo ? "demo" : "")}
            role="note"
          >
            <strong>
              {isStage04aTest ? "TEST ONLY · 合成展陈测试" : isDemo
                ? "MOCK · 演示数据"
                : isHistoryPreview
                  ? historyCopy.appTitle
                  : "循着时间，阅读历史"}
            </strong>
            <span>
              {isStage04aTest ? "所有记录和影像均为隔离的 TEST ONLY 合成夹具，不含历史事实，不能用于公开发布。" : isDemo
                ? "当前事件、来源及时期与地点匹配仅用于交互测试，不构成历史事实。"
                : isHistoryPreview
                  ? historyCopy.appBody
                  : "在地图上选择地点，在档案中阅读史料；每份记录均保留对应来源。"}{" "}
              {isHistoryPreview ? historyCopy.appFootnote : "无单一地点的专题保留在章节目录中；来源说明与不确定性随档案展示。"}
            </span>
          </div>
          <RecommendedRoute steps={recommendedRoute} open={routeOpen} onToggle={() => setRouteOpen((value) => !value)} onStep={handleRecommendedStep} />
          <Timeline
            periods={visiblePeriods}
            selectedId={state.periodId}
            onSelect={selectPeriod}
          />
          <div className="explorer-toolbar">
            <div className="breadcrumb">
              <span>时间索引</span>
              <span>/</span>
              <strong>{period.range}</strong>
              {state.placeId && (
                <>
                  <span>/</span>
                  <strong>
                    {visiblePlaces.find((p) => p.id === state.placeId)?.name}
                  </strong>
                </>
              )}
              {event && (
                <>
                  <span>/</span>
                  <span>事件档案</span>
                </>
              )}
            </div>
            <div className="back-actions">
              <button
                className="text-button"
                disabled={state.history.length === 0}
                onClick={() => scenes.act({ type: "BACK" })}
              >
                <Arrow direction="left" />
                返回上一层
              </button>
              <button
                className="text-button"
                onClick={() => scenes.act({ type: "RESET" })}
              >
                回到起点
              </button>
            </div>
          </div>
          {activeView && <div className="dual-view-toolbar">
            <div className="dual-view-buttons" role="group" aria-label="抗战历史地图视角">
              <button aria-pressed={activeView === "school"} onClick={()=>changeView("school")}>学校迁校</button>
              <button aria-pressed={activeView === "organization"} onClick={()=>changeView("organization")}>红色组织活动</button>
            </div>
            <p aria-live="polite">{activeView === "school" ? "沿迁校、途经与复员关系阅读；计划与分散办学分别标识。" : "走近同一片时空中的组织活动；联系线不代表迁校路线。"}</p>
            {state.placeId && <button className="text-button" onClick={()=>scenes.act({type:"VIEW",viewMode:state.viewMode,placeId:null,eventId:null})}>本视角全部档案</button>}
          </div>}
          <ResearchShelf periodId={period.id} eventId={event?.id ?? null} research={research} />
          {!event && !dossierOpen && <ChapterEvidencePreview
            periodId={period.id}
            periodRange={period.range}
            events={periodEvents}
            images={images.filter((image) => image.relatedEventIds.some((eventId) => periodEvents.some((item) => item.id === eventId)))}
            onOpen={(mediaId) => dispatch({ type: "OPEN_MEDIA", mediaId })}
            onSources={(sourceIds) => dispatch({ type: "OPEN_SOURCE", sourceIds })}
          />}
          {dossier && !dossierOpen && <button ref={dossierTrigger} className="open-dossier" onClick={()=>dossierPage(0)} aria-expanded={false}>
            <span><strong>1947 · 五·卅一事件卷宗</strong><span>六页档案，依次阅读背景、筹备、游行、冲突、营救与纪念。</span></span>
            <span className="dossier-entry-action">打开六页卷宗 →</span>
          </button>}
          {formal && period.id === "p1947" && !dossierOpen && <HistoryWalk data={walkData} sources={uiContent.sources}
            onStep={(eventId,placeId) => dispatch({type:"PLACE",placeId,eventId})}
            onExit={() => dispatch({type:"VIEW",viewMode:state.viewMode,placeId:null,eventId:null})} />}
          {period.id === "p2026" ? <div className="contemporary-arrival-bridge"><p className="eyebrow">2026 / 当代终章</p><h3>历史来到今天。</h3><p>九位共同创作者的文字与声音，沿着这条时间轴继续展开。</p><button onClick={() => selectPeriod("p2026")}>走近今天的我们 <Arrow /></button></div> : dossierOpen && dossier ? <HistoricalDossier dossier={dossier} isSyntheticTest={isStage04aTest} pageIndex={state.dossierPage!}
            events={periodEvents} sources={uiContent.sources} places={uiContent.places} reduced={reduced} director={director}
            onPage={dossierPage} onClose={()=>{dispatch({type:"CLOSE_DOSSIER"}); requestAnimationFrame(()=>dossierTrigger.current?.focus({preventScroll:true}));}}
            onSources={()=>dispatch({type:"OPEN_SOURCE",sourceIds:dossier.pages[state.dossierPage!]?.sourceIds})}
            renderMedia={renderMedia} relatedEvents={uiContent.events} onRelatedEvent={openRecord} /> : <div className={"explorer-grid " + (availablePlaceIds.length ? "" : "catalog-first")}>
            {availablePlaceIds.length > 0 && <HistoryMap
              places={visiblePlaces}
              selectedId={state.placeId}
              isDemo={isDemo}
              isHistoryPreview={isHistoryPreview}
              isSyntheticTest={isStage04aTest}
              relations={periodRelations}
              period={period}
              viewMode={activeView}
              availablePlaceIds={availablePlaceIds}
              events={viewFilteredEvents}
              sources={uiContent.sources}
              onEvent={openRecord}
              onSelect={(placeId) =>
                scenes.act({
                  type: "PLACE",
                  placeId,
                  eventId:
                    viewFilteredEvents.some(item=>item.placeIds.includes(placeId)) ? selectionForView(periodEvents,activeView,placeId,null).eventId : null,
                })
              }
            />}
            <EventPanel
              event={event}
              events={visibleEvents}
              period={period}
              places={uiContent.places}
              sources={uiContent.sources}
              isDemo={isDemo}
              isHistoryPreview={isHistoryPreview}
              onEvent={(eventId) => scenes.act({ type: "EVENT", eventId })}
              onSources={() => scenes.act({ type: "OPEN_SOURCE" })}
              onPreviousPeriod={() => { const index = visiblePeriods.findIndex((item) => item.id === period.id); if (index > 0) selectPeriod(visiblePeriods[index - 1].id); }}
              onNextPeriod={() => { const index = visiblePeriods.findIndex((item) => item.id === period.id); if (index < visiblePeriods.length - 1) selectPeriod(visiblePeriods[index + 1].id); else selectPeriod("p2026"); }}
              renderMedia={renderMedia}
              relatedEvents={uiContent.events}
              onRelatedEvent={openRecord}
              onPlace={placeId => {
                dispatch({type:"PLACE",placeId,eventId:event?.id ?? null});
                requestAnimationFrame(() => document.querySelector(".map-card")?.scrollIntoView({block:"start",behavior:reduced?"auto":"smooth"}));
              }}
            />
          </div>}
          {formal && <aside className="centennial-bridge" aria-label="百年回望专题入口">
            <div><p className="eyebrow">1924—2024 / 百年回望</p><h3>从百年校史，走向新的起点。</h3><p>2024年的百年校庆，与2026年九位同学的创作记录，在此相接。</p></div>
            <button type="button" onClick={openCentennial}>打开百年回望 →</button>
          </aside>}
          <div className="explore-bottom-note">
            <span>学校主要迁校的时间关系 · 党组织活动的联系关系</span>
            <span>历史关系为示意；按章节阅读，切换地图视角，回查文献来源。</span>
          </div>
        </section>
        <ContemporarySection active={period.id === "p2026"} reduced={reduced} director={director} onHistory={() => selectPeriod("p1947")} onHome={() => { pauseTeamAudio(); scenes.home(); }} />
      </main>
      {formal && <CentennialExhibit open={centennialOpen} data={centennialData} onClose={closeCentennial}
        onHistory={() => {closeCentennial();selectPeriod("p1924");}}
        onToday={() => {closeCentennial();selectPeriod("p2026");}}
        onEvent={openRecord} />}
      <EvidenceDrawer
        director={director}
        reduced={reduced}
        open={state.drawerOpen}
        sources={sources}
        onClose={() => dispatch({ type: "CLOSE_SOURCE" })}
      />
      <HistoricalMediaViewer images={eventImages} selectedId={state.mediaId}
        onSelect={mediaId=>dispatch({type:"OPEN_MEDIA",mediaId})}
        onClose={()=>dispatch({type:"CLOSE_MEDIA"})}
        onSources={sourceIds=>dispatch({type:"OPEN_SOURCE",sourceIds})} />
      <ContinuityAtlas
        ref={portal}
        year={period.range}
        points={visiblePlaces.map((p) => p.schematic)}
      />
      <div className="entry-actions">
        <button onClick={scenes.skip}>
          跳过转场 <Arrow />
        </button>
        <button onClick={scenes.home}>
          返回首页 <Arrow direction="left" />
        </button>
      </div>
      <span className="sr-only">{site.formalTitle}</span>
      <IntroSequence reduced={reduced} replay={introReplay} />
      {formal && <MusicPlayer />}
    </div>
  );
}
