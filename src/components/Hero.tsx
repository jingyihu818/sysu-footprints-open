import { site } from "../config/site";
import type { Place } from "../types/content";
import AtlasPaper from "./AtlasPaper";
import { Arrow } from "./Icon";
import MeteorField from "./MeteorField";
import historyCopy from "../history/copy";
export default function Hero({
  isDemo,
  isHistoryPreview,
  isSyntheticTest = false,
  places,
  year,
  onEnter,
  onOpenGuide,
  onReplayIntro,
}: {
  isDemo: boolean;
  isHistoryPreview: boolean;
  isSyntheticTest?: boolean;
  places: Place[];
  year: string;
  onEnter: (mode: "start" | "free") => void;
  onOpenGuide: (target: HTMLElement) => void;
  onReplayIntro?: () => void;
}) {
  return (
    <section
      className="hero cinematic-hero"
      id="home"
      aria-labelledby="hero-title"
    >
      <div className="hero-observation-light" aria-hidden="true" />
      <MeteorField scene="hero" />
      <div className="hero-copy">
        <p className="eyebrow">
          <span className="short-rule" />
          时间留下印记，史料让它清晰。
        </p>
        <h1 id="hero-title" tabIndex={-1}>
          {site.title}
          <span className="hero-en">FOOTPRINTS / SUN YAT-SEN UNIVERSITY</span>
        </h1>
        <h2>{site.subtitle}</h2>
        <p className="hero-intro">{site.introduction}</p>
        <div className="hero-actions">
          <button
            className="button button-red"
            onClick={() => onEnter("start")}
          >
            开始探索 <Arrow />
          </button>
          <button
            className="button button-outline"
            onClick={() => onEnter("free")}
          >
            自由探索 <Arrow />
          </button>
          <button
            className="button button-guide"
            type="button"
            onClick={(event) => onOpenGuide(event.currentTarget)}
            aria-haspopup="dialog"
          >
            探索指南
          </button>
        </div>
        {onReplayIntro && <button className="intro-replay" type="button" onClick={onReplayIntro}>重看宣传片</button>}
        <p className="hero-footnote">
          {isSyntheticTest ? "TEST ONLY · 合成展陈测试，不代表历史事实或正式内容" : isDemo
            ? "MOCK · 交互演示，不代表历史事实"
            : isHistoryPreview
              ? historyCopy.heroFootnote
              : "循着史料，读懂校园中的红色记忆。"}
        </p>
      </div>
      <div
        className="hero-stage"
        aria-label="档案地图的抽象示意空间，不是历史文献"
      >
        <div className="hero-stage-heading">
          <span>历史可以被阅读，也可以被走近。</span>
          <span className="hero-stage-mark">1924 — 2026 / 时间的足迹</span>
        </div>
        <div className="hero-paper-stack">
          <div className="paper-depth paper-depth-back" aria-hidden="true" />
          <div className="paper-depth paper-depth-mid" aria-hidden="true" />
          <div className="hero-atlas">
            <span className="gilded-light gilded-edge" aria-hidden="true" />
            <AtlasPaper year={year} points={places.map((p) => p.schematic)} decorativeConnections />
            <div className="hero-atlas-caption">
              <span>时间 / 地点 / 史料</span>
              <span>示意图 · {isSyntheticTest ? "TEST ONLY" : isDemo ? "MOCK" : isHistoryPreview ? historyCopy.heroBadge : "循迹而行"}</span>
            </div>
            <span className="paper-red-thread" aria-hidden="true" />
          </div>
        </div>
        <div className="hero-stage-caption">
          <span>一张图纸，是一段探索的开始。</span>
          <span>原创示意视觉 / 非历史档案</span>
        </div>
      </div>
      <div className="hero-bottom">
          <span>中山大学学生学习小组创作 · 非中山大学官方网站</span>
        <a
          href="#explore"
          onClick={(e) => {
            e.preventDefault();
            onEnter("start");
          }}
        >
          沿着时间，走进校园记忆 <Arrow direction="down" />
        </a>
      </div>
    </section>
  );
}
