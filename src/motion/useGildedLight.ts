import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { MotionDirector, MotionSpec } from "./director";

interface Options {
  shell: RefObject<HTMLDivElement | null>;
  director: MotionDirector;
  reduced: boolean;
  periodIndex: number;
  eventId: string | null;
}

/** Presentation only. Never dispatches, writes content, or owns a frame loop. */
export function useGildedLight({ shell, director, reduced, periodIndex, eventId }: Options) {
  const previous = useRef({ periodIndex, eventId });
  const actions = useRef<{ timeline: (index: number) => void; map: () => void; archive: () => void } | null>(null);
  useEffect(() => {
    const root = shell.current;
    if (!root || reduced) return;
    const groups = ["hero", "entry", "timeline", "map", "archive"].map(name => "gilded-" + name);
    const cancel = () => groups.forEach(name => director.cancel(name));
    const active = () => !document.hidden && ["A", "B"].includes(root.dataset.gilded ?? "") && director.enabled;
    const visible = (element: Element | null) => {
      if (!element) return false;
      const r = element.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight && r.width > 0;
    };
    const settings = () => ({
      peak: Number.parseFloat(getComputedStyle(root).getPropertyValue("--gilded-peak")) || 0.46,
      cinematic: root.dataset.gilded === "B",
    });
    const fade = (element: Element, peak: number, duration: number): MotionSpec => ({
      element,
      keyframes: [{ opacity: 0 }, { opacity: peak, offset: 0.32 }, { opacity: 0 }],
      options: { duration, easing: "cubic-bezier(.22,.61,.36,1)" },
    });
    const edge = (selector: string, group: "hero" | "entry") => {
      const surface = root.querySelector(selector), light = surface?.querySelector(".gilded-edge");
      if (!active() || !light || !visible(surface)) return;
      const { peak, cinematic } = settings();
      const duration = cinematic ? 1600 : 1100;
      const specs: MotionSpec[] = [{
        element: light,
        keyframes: [
          { transform: "translateX(-35%)", opacity: 0 },
          { transform: "translateX(55%)", opacity: peak, offset: 0.38 },
          { transform: "translateX(175%)", opacity: 0 },
        ],
        options: { duration, easing: "cubic-bezier(.3,0,.25,1)" },
      }];
      const trace = surface?.querySelector(".atlas-gilded-trace");
      if (trace) specs.push(fade(trace, peak * 0.44, duration));
      void director.play("gilded-" + group, specs);
    };
    let previewIndex = periodIndex;
    const timeline = (index: number) => {
      const nav = root.querySelector<HTMLElement>(".timeline"), light = nav?.querySelector(".gilded-timeline");
      if (!nav || !light) return;
      const from = previewIndex;
      previewIndex = index;
      if (!active() || !visible(nav) || from === index) return;
      const css = getComputedStyle(nav), first = parseFloat(css.getPropertyValue("--period-first")) || 0, step = parseFloat(css.getPropertyValue("--period-step")) || 0;
      const { peak, cinematic } = settings();
      const x = (i: number) => "translateX(" + (first + step * i - 32) + "px)";
      void director.play("gilded-timeline", [{
        element: light,
        keyframes: [{ transform: x(from), opacity: 0 }, { opacity: Math.min(0.9, peak + 0.2), offset: 0.3 }, { transform: x(index), opacity: 0 }],
        options: { duration: cinematic ? 820 : 620, easing: "cubic-bezier(.22,.61,.36,1)" },
      }]);
    };
    const map = () => {
      const surface = root.querySelector<HTMLElement>(".map-surface"), light = surface?.querySelector<HTMLElement>(".gilded-map");
      if (!active() || !surface || !visible(surface)) return;
      const { peak, cinematic } = settings(), duration = cinematic ? 1000 : 760;
      const specs: MotionSpec[] = [];
      const trace = surface.querySelector(".atlas-gilded-trace");
      if (trace) specs.push(fade(trace, peak * 0.5, duration));
      const node = surface.querySelector(".map-node.selected .node-target");
      if (light && node) {
        const a = surface.getBoundingClientRect(), b = node.getBoundingClientRect();
        light.style.left = b.left + b.width / 2 - a.left + "px";
        light.style.top = b.top + b.height / 2 - a.top + "px";
        specs.push({ element: light, keyframes: [
          { opacity: 0, transform: "translate(-50%,-50%) scale(.82)" },
          { opacity: peak * 0.55, offset: 0.35 },
          { opacity: 0, transform: "translate(-50%,-50%) scale(1.15)" },
        ], options: { duration } });
      }
      void director.play("gilded-map", specs);
    };
    const archive = () => {
      const panel = root.querySelector(".event-panel"), light = panel?.querySelector(".gilded-archive");
      if (!active() || !light || !visible(panel)) return;
      const { peak, cinematic } = settings();
      void director.play("gilded-archive", [fade(light, peak * 0.8, cinematic ? 900 : 700)]);
    };
    actions.current = { timeline, map, archive };
    const paper = root.querySelector(".hero-atlas");
    const hero = () => edge(".hero-atlas", "hero");
    const preview = (event: Event) => {
      if (event.target instanceof HTMLInputElement && event.target.matches(".timeline-range-control")) timeline(Number(event.target.value));
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") cancel(); };
    const visibility = () => { if (document.hidden) cancel(); };
    const changes = new MutationObserver(records => {
      for (const record of records) {
        if (record.attributeName === "data-gilded") { cancel(); if (active()) hero(); }
        if (record.attributeName === "data-entry-motion") {
          if (root.dataset.entryMotion === "running") edge(".continuity-sheet", "entry");
          else director.cancel("gilded-entry");
        }
      }
    });
    changes.observe(root, { attributes: true, attributeFilter: ["data-gilded", "data-entry-motion"] });
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(entries => {
      for (const entry of entries) if (!entry.isIntersecting) {
        if ((entry.target as Element).matches(".hero-atlas")) director.cancel("gilded-hero");
        if ((entry.target as Element).matches(".map-surface")) director.cancel("gilded-map");
        if ((entry.target as Element).matches(".event-panel")) director.cancel("gilded-archive");
        if ((entry.target as Element).matches(".timeline")) director.cancel("gilded-timeline");
      }
    }) : null;
    root.querySelectorAll(".hero-atlas,.map-surface,.event-panel,.timeline").forEach(e => observer?.observe(e));
    paper?.addEventListener("pointerenter", hero);
    paper?.addEventListener("click", hero);
    root.addEventListener("input", preview);
    window.addEventListener("keydown", escape);
    window.addEventListener("resize", cancel);
    document.addEventListener("visibilitychange", visibility);
    const opening = window.setTimeout(hero, 280);
    return () => {
      clearTimeout(opening); changes.disconnect(); observer?.disconnect();
      paper?.removeEventListener("pointerenter", hero); paper?.removeEventListener("click", hero);
      root.removeEventListener("input", preview); window.removeEventListener("keydown", escape);
      window.removeEventListener("resize", cancel);
      document.removeEventListener("visibilitychange", visibility);
      actions.current = null; cancel();
    };
    // Period/event effects below keep the listener lifetime independent of state updates.
  }, [shell, director, reduced]);
  useEffect(() => {
    const before = previous.current;
    previous.current = { periodIndex, eventId };
    if (reduced) return;
    if (before.periodIndex !== periodIndex) { actions.current?.timeline(periodIndex); actions.current?.map(); actions.current?.archive(); }
    else if (before.eventId !== eventId) { actions.current?.map(); actions.current?.archive(); }
  }, [periodIndex, eventId, reduced]);
}
