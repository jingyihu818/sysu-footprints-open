import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { ambientMeteorScore, heroMeteorScore, meteorScore, meteorTravel } from "../motion/meteorModel";
import "../meteors.css";

const exploreScore = meteorScore.slice(0, 2);
const entryScore = meteorScore.map((spec, index) => ({ ...spec, x: index === 0 ? -8 : index === 3 ? 92 : spec.x, delay: index === 0 ? -1 : index === 3 ? -.1 : spec.delay }));
const enhancedHeroScore = [...heroMeteorScore, ...ambientMeteorScore.slice(0, 4)];
const constrainedAmbientScore = ambientMeteorScore.filter((_, index) => index % 3 === 0);
const constrainedHeroScore = enhancedHeroScore.filter((spec, index) => spec.depth !== "near" && index % 2 === 0);

function isConstrainedDevice() {
  return matchMedia("(max-width: 760px)").matches ||
    (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4) ||
    ("deviceMemory" in navigator && Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory) <= 4) ||
    ("connection" in navigator && Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData));
}

export default function MeteorField({ scene }: { scene: "hero" | "explore" | "entry" | "ambient" }) {
  const ref = useRef<HTMLDivElement>(null);
  const constrained = isConstrainedDevice();
  const score = scene === "ambient" ? (constrained ? constrainedAmbientScore : ambientMeteorScore) : scene === "explore" ? exploreScore : scene === "entry" ? entryScore :
    constrained ? constrainedHeroScore : enhancedHeroScore;

  useEffect(() => {
    const field = ref.current, parent = field?.parentElement;
    if (!field || !parent) return;
    const shell = field.closest<HTMLElement>(".film-shell");
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = scene === "entry";
    let stopped = false;
    const sync = () => {
      if (stopped) return;
      const reduced = media.matches || shell?.dataset.motion === "reduced";
      const entering = shell?.dataset.entryMotion === "running";
      field.dataset.state = reduced ? "reduced" : document.hidden ? "hidden" :
        (scene === "entry" ? entering : visible && !entering) ? "running" : "paused";
    };
    const geometry = () => {
      const bounds = (scene === "ambient" ? field : parent).getBoundingClientRect();
      score.forEach((spec, index) => {
        const line = field.children[index] as HTMLElement;
        const travel = meteorTravel(spec, bounds.width);
        line.style.setProperty("--travel-x", travel.x + "px");
        line.style.setProperty("--travel-y", travel.y + "px");
      });
      if (scene === "entry" || scene === "ambient") return;
      const selector = scene === "hero" ? ".hero-copy > p,.hero-copy > h1,.hero-copy > h2,.hero-actions,.hero-atlas,.hero-stage-heading,.hero-stage-caption,.hero-bottom" :
        ".section-heading,.content-notice,.timeline,.explorer-toolbar,.explorer-grid,.explore-bottom-note";
      const holes = [...parent.querySelectorAll<HTMLElement>(selector)].map((node) => {
        const box = node.getBoundingClientRect();
        const margin = 12;
        const opening = node.closest<HTMLElement>(".hero-copy");
        const transform = opening ? getComputedStyle(opening).transform : "none";
        const shift = transform === "none" ? { m41: 0, m42: 0 } : new DOMMatrixReadOnly(transform);
        return "<rect x=\"" + (box.left - bounds.left - shift.m41 - margin) + "\" y=\"" + (box.top - bounds.top - shift.m42 - margin) + "\" width=\"" + (box.width + margin * 2) + "\" height=\"" + (box.height + margin * 2 + (opening ? 26 : 0)) + "\" fill=\"black\"/>";
      }).join("");
      const svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + bounds.width + "\" height=\"" + bounds.height + "\" viewBox=\"0 0 " + bounds.width + " " + bounds.height + "\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/>" + holes + "</svg>";
      if (CSS.supports("mask-mode", "luminance")) {
        field.style.maskImage = "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
        field.dataset.mask = "protected";
      } else {
        field.style.removeProperty("mask-image");
        field.dataset.mask = "fallback";
      }
    };
    const resize = typeof ResizeObserver === "function" ? new ResizeObserver(geometry) : null;
    resize?.observe(parent);
    if (scene === "ambient") resize?.observe(field);
    for (const child of parent.children) if (child !== field) resize?.observe(child);
    const intersection = typeof IntersectionObserver === "function" ? new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }) : null;
    if (scene !== "entry") intersection?.observe(parent);
    const mutations = new MutationObserver(sync);
    if (shell) mutations.observe(shell, { attributes: true, attributeFilter: ["data-motion", "data-entry-motion"] });
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    geometry(); sync();
    return () => {
      stopped = true;
      resize?.disconnect(); intersection?.disconnect(); mutations.disconnect();
      document.removeEventListener("visibilitychange", sync);
      media.removeEventListener("change", sync);
      field.dataset.state = "paused";
    };
  }, [scene, score]);

  return <div ref={ref} className="meteor-field" data-scene={scene} data-profile={constrained ? "constrained" : "full"} data-state="paused" aria-hidden="true">
    {score.map((spec, index) => <i key={index} className="meteor-streak" data-depth={spec.depth} style={{
      left: spec.x + "%", top: spec.y + "%", width: spec.length + "px",
      "--angle": spec.angle + "deg", "--cycle": spec.cycle + "s", "--delay": spec.delay + "s",
      "--light": spec.light * (scene === "explore" ? .45 : scene === "entry" ? .6 : 1),
      "--motion-name": scene === "ambient" ? "meteor-flight-ambient" : scene === "hero" ? "meteor-flight-hero-" + (index % 4) : "meteor-flight-" + (index % 6),
    } as CSSProperties} />)}
  </div>;
}
