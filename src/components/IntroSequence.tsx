import {useCallback, useEffect, useLayoutEffect, useRef, useState} from "react";
import {introConfig} from "virtual:intro-config";
import {shouldShowFirstVisitIntro} from "./introPolicy";
import {setIntroBlocking} from "../team/audioFocus";
import "./intro.css";

const sessionKey = "footprints-intro-v1-seen";
function firstVisit(reduced: boolean) {
  let alreadySeen = false;
  try { alreadySeen = sessionStorage.getItem(sessionKey) === "yes"; } catch { /* Storage may be disabled. */ }
  return shouldShowFirstVisitIntro({enabled: introConfig.enabled, reducedMotion: reduced, search: location.search, hash: location.hash, alreadySeen});
}
export default function IntroSequence({reduced, replay}: {reduced: boolean; replay: number}) {
  const requested = new URLSearchParams(location.search).get("intro");
  const film = requested === "film" || (requested !== "paper" && introConfig.mode === "film");
  return film ? <FilmIntro reduced={reduced} replay={replay} /> : <PaperIntro key={replay} reduced={reduced} replay={replay} />;
}

function PaperIntro({reduced, replay}: {reduced: boolean; replay: number}) {
  const [visible, setVisible] = useState(() => replay > 0 ? introConfig.enabled && !reduced : firstVisit(reduced));
  useLayoutEffect(() => {setIntroBlocking(visible && !reduced);return ()=>setIntroBlocking(false);},[visible,reduced]);
  const finish = useCallback(() => {
    try { sessionStorage.setItem(sessionKey, "yes"); } catch { /* Storage may be disabled. */ }
    delete document.documentElement.dataset.footprintsEntry;
    setVisible(false);
  }, []);
  useLayoutEffect(() => {
    if (!visible || reduced) return;
    document.documentElement.dataset.footprintsEntry = "paper";
    const timer = window.setTimeout(finish, 2600);
    const hidden = () => { if (document.hidden) finish(); };
    document.addEventListener("visibilitychange", hidden);
    return () => { clearTimeout(timer); delete document.documentElement.dataset.footprintsEntry; document.removeEventListener("visibilitychange", hidden); };
  }, [visible, reduced, finish]);
  useEffect(() => { if (reduced && visible) finish(); }, [reduced, visible, finish]);
  return visible && !reduced ? <div className="paper-entry-control" aria-label="足迹序章">
    <span>沿着时间，走进校园记忆</span><button type="button" onClick={finish}>跳过开场</button>
  </div> : null;
}

function FilmIntro({reduced, replay}: {reduced: boolean; replay: number}) {
  const [visible, setVisible] = useState(() => replay > 0 ? introConfig.enabled && !reduced : firstVisit(reduced));
  useLayoutEffect(() => {setIntroBlocking(visible && !reduced);return ()=>setIntroBlocking(false);},[visible,reduced]);
  const [dissolving, setDissolving] = useState(false);
  const [muted, setMuted] = useState(false);
  const [small, setSmall] = useState(() => window.matchMedia("(max-width: 760px)").matches);
  const dialog = useRef<HTMLDialogElement>(null), video = useRef<HTMLVideoElement>(null);
  const fadeTimer = useRef<number | null>(null);
  const finish = useCallback((keepHeroEntry = false) => {
    if (fadeTimer.current !== null) { window.clearTimeout(fadeTimer.current); fadeTimer.current = null; }
    try { sessionStorage.setItem(sessionKey, "yes"); } catch { /* Privacy modes may disable storage. */ }
    video.current?.pause();
    if (keepHeroEntry) window.setTimeout(() => delete document.documentElement.dataset.footprintsEntry, 2600);
    else delete document.documentElement.dataset.footprintsEntry;
    dialog.current?.close();
    setVisible(false);
    document.getElementById("hero-title")?.focus({preventScroll: true});
  }, []);
  const dissolve = useCallback(() => {
    if (fadeTimer.current !== null) return;
    setDissolving(true);
    document.documentElement.dataset.footprintsEntry = "paper";
    fadeTimer.current = window.setTimeout(() => {
      fadeTimer.current = null;
      finish(true);
    }, 720);
  }, [finish]);
  useEffect(() => { if (replay > 0 && introConfig.enabled && !reduced) { delete document.documentElement.dataset.footprintsEntry; setDissolving(false); setMuted(false); setVisible(true); } }, [replay, reduced]);
  useEffect(() => { if (reduced && visible) finish(); }, [reduced, visible, finish]);
  useEffect(() => {
    if (!visible) return;
    const element = dialog.current, movie = video.current;
    if (!element || !movie) return;
    let disposed = false;
    if (!element.open) element.showModal();
    element.querySelector<HTMLButtonElement>("button")?.focus({preventScroll: true});
    try { sessionStorage.setItem(sessionKey, "yes"); } catch { /* Storage may be disabled. */ }
    const loadingTimeout = window.setTimeout(() => { if (!disposed && !movie.paused && movie.readyState < 2 && movie.currentTime < .1) finish(); }, 5000);
    const hidden = () => { if (document.hidden) finish(); };
    document.addEventListener("visibilitychange", hidden);
    movie.muted = false;
    movie.play().catch((error: {name?:string}) => {
      if (disposed || error.name === "AbortError") return;
      if (error.name !== "NotAllowedError") { finish(); return; }
      // A fresh browser may forbid audible autoplay. Keep the film and expose the sound button.
      movie.muted = true; setMuted(true);
      void movie.play().catch(() => { if (!disposed) finish(); });
    });
    return () => {
      disposed = true;
      clearTimeout(loadingTimeout);
      if (fadeTimer.current !== null) { clearTimeout(fadeTimer.current); fadeTimer.current = null; }
      document.removeEventListener("visibilitychange", hidden);
      movie.pause(); element.close();
    };
  }, [visible, finish]);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const update = () => setSmall(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  if (!visible || !introConfig.enabled) return null;
  return <dialog ref={dialog} className={"intro-sequence" + (dissolving ? " intro-dissolving" : "")} aria-label="足迹电影序章"
    onCancel={event => { event.preventDefault(); finish(); }}>
    <video ref={video} src={import.meta.env.BASE_URL + (small ? introConfig.mobile : introConfig.desktop)}
      poster={import.meta.env.BASE_URL + (small ? introConfig.mobilePoster ?? introConfig.poster : introConfig.poster)} muted={muted} playsInline preload="auto"
      onEnded={() => dissolve()} onError={() => finish()}
      onTimeUpdate={() => { const movie = video.current; if (movie && movie.duration - movie.currentTime < .72) dissolve(); }} />
    <div className="intro-heading"><span>足迹 / 序章</span><div className="intro-actions">
      <button type="button" onClick={() => { const nextMuted = !muted; setMuted(nextMuted); if (video.current) { video.current.muted = nextMuted; if (!nextMuted) void video.current.play().catch(() => setMuted(true)); } }} aria-pressed={!muted}>{muted ? "开启声音" : "关闭声音"}</button>
      <button type="button" onClick={() => finish()}>跳过开场</button>
    </div></div>
    <p className="intro-caption">让历史，不止于阅读<span>{muted ? "点击开启声音 · 随时可以开始探索" : "有声播放 · 随时可以开始探索"}</span></p>
  </dialog>;
}
