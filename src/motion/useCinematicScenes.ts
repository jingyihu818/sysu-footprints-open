import { useEffect, useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { flushSync } from "react-dom";
import type { Place } from "../types/content";
import type { ExplorerAction } from "../state/explorer";
import { MotionDirector } from "./director";
import {
  createEntryKeyframes,
  createEntryOpacityKeyframes,
  entryDuration,
  ENTRY_EASING,
} from "./entryMotion";
import type { MotionSpec } from "./director";
export function landInExplorer(root: Element, mode: "start" | "free") {
  const target = root.querySelector<HTMLElement>(mode === "start" ? "#event-panel-title" : ".timeline")
    ?? root.querySelector<HTMLElement>("#explore-title");
  if (!target) return;
  const headerHeight = root.querySelector(".site-header")?.getBoundingClientRect().height ?? 78;
  const stickyBottom = Math.max(headerHeight, ...[".timeline", ".explorer-toolbar"].map(selector => {
    const element = root.querySelector<HTMLElement>(selector);
    return element ? (parseFloat(getComputedStyle(element).top) || 0) + element.getBoundingClientRect().height : 0;
  }));
  const landingTop = mode === "start" ? stickyBottom + 28 : headerHeight + 38;
  window.scrollTo({top: window.scrollY + target.getBoundingClientRect().top - landingTop, behavior: "instant"});
  (mode === "start" ? target : root.querySelector<HTMLElement>(".timeline [data-period][aria-pressed='true']"))?.focus({preventScroll: true});
}
interface SceneOptions {
  shell: RefObject<HTMLDivElement | null>;
  portal: RefObject<HTMLDivElement | null>;
  director: MotionDirector;
  reduced: boolean;
  periodIndex: number;
  eventId: string | null;
  places: Place[];
  dispatch: (action: ExplorerAction) => void;
  entryTargets?: Record<"start" | "free", { periodId: string; eventId: string | null }>;
}
export function useCinematicScenes({
  shell,
  portal,
  director,
  reduced,
  periodIndex,
  eventId,
  places,
  dispatch,
  entryTargets,
}: SceneOptions) {
  const previous = useRef({ periodIndex, eventId, x: 360, y: 235 });
  useLayoutEffect(() => {
    director.enabled = !reduced;
    if (reduced) director.cancelAll("skipped");
    const root = shell.current;
    if (!root) return;
    const before = previous.current;
    const center = places.length
      ? {
          x: places.reduce((sum, p) => sum + p.schematic.x, 0) / places.length,
          y: places.reduce((sum, p) => sum + p.schematic.y, 0) / places.length,
        }
      : { x: 360, y: 235 };
    previous.current = { periodIndex, eventId, ...center };
    if (before.periodIndex !== periodIndex) {
      director.cancel("focus");
      const camera = root.querySelector<HTMLElement>(
        ".map-surface .atlas-camera",
      );
      const sampled = camera ? getComputedStyle(camera).transform : "none";
      director.cancel("period");
      if (camera && !reduced) {
        const direction = Math.sign(periodIndex - before.periodIndex);
        const dx = Math.max(
          -28,
          Math.min(28, (before.x - center.x) / 8 + direction * 12),
        );
        const specs: MotionSpec[] = [
          {
            element: camera,
            keyframes: [
              {
                transform:
                  sampled !== "none"
                    ? sampled
                    : "translate(" + dx + "px,8px) scale(1.055)",
              },
              { transform: "none" },
            ],
            options: { duration: 560, easing: "cubic-bezier(.3,0,.2,1)" },
          },
        ];
        const caption = root.querySelector(".map-period-caption");
        if (caption)
          specs.push({
            element: caption,
            keyframes: [
              {
                transform: "translateX(" + direction * 18 + "px)",
                opacity: 0.35,
              },
              { transform: "none", opacity: 1 },
            ],
            options: { duration: 420 },
          });
        root.querySelectorAll(".map-node .node-target").forEach((element, i) =>
          specs.push({
            element,
            keyframes: [
              { transform: "scale(.7) translateY(10px)", opacity: 0.35 },
              { transform: "none", opacity: 1 },
            ],
            options: { duration: 320, delay: Math.min(180, i * 40) },
          }),
        );
        const panel = root.querySelector(".event-panel");
        if (panel)
          specs.push({
            element: panel,
            keyframes: [
              {
                transform: "translate(" + direction * 14 + "px,8px)",
                opacity: 0.65,
              },
              { transform: "none", opacity: 1 },
            ],
            options: { duration: 420, delay: 70 },
          });
        root.dataset.periodMotion = "running";
        void director.play("period", specs, () => {
          delete root.dataset.periodMotion;
        });
      }
    } else if (before.eventId !== eventId) {
      director.cancel("period");
      const panel = root.querySelector<HTMLElement>(".event-panel");
      const sampled = panel ? getComputedStyle(panel).transform : "none";
      director.cancel("focus");
      if (panel && !reduced) {
        const desktop = window.matchMedia("(min-width: 761px)").matches;
        void director.play("focus", [
          {
            element: panel,
            keyframes: [
              {
                transform:
                  sampled !== "none"
                    ? sampled
                    : desktop
                      ? "translate(-24px,12px) scale(.985)"
                      : "translateY(18px) scale(.99)",
                opacity: 0.68,
              },
              { transform: "none", opacity: 1 },
            ],
            options: { duration: 400 },
          },
        ]);
      }
    }
  }, [periodIndex, eventId, places, reduced, director, shell]);
  useEffect(() => {
    const root = shell.current;
    const interrupt = () => director.cancel("entry");
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") interrupt();
    };
    const anchors = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      const anchor = (event.target as Element).closest('a[href^="#"]');
      if (!anchor) return;
      director.cancelAll();
      if (anchor.getAttribute("href") === "#home") {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "instant" });
        root
          ?.querySelector<HTMLElement>(".brand")
          ?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("resize", interrupt);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("keydown", escape);
    root?.addEventListener("click", anchors);
    const visibility = () => {
      if (document.hidden) director.cancelAll();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("resize", interrupt);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("keydown", escape);
      root?.removeEventListener("click", anchors);
      document.removeEventListener("visibilitychange", visibility);
      director.cancelAll();
    };
  }, [director, shell]);
  const enter = (mode: "start" | "free") => {
    const root = shell.current,
      layer = portal.current;
    const from = root?.querySelector(".hero-atlas")?.getBoundingClientRect();
    director.cancelAll();
    const selection = entryTargets?.[mode];
    flushSync(() => dispatch({ type: "ENTER", mode, selection }));
    director.cancel("period");
    director.cancel("focus");
    // Navigation must work for archive-only chapters, before optional FLIP effects.
    if (root) landInExplorer(root, mode);
    if (selection) {
      const url = new URL(window.location.href);
      url.searchParams.set("chapter", selection.periodId);
      url.searchParams.delete("member");
      for (const key of ["place", "view", "dossier"]) url.searchParams.delete(key);
      if (selection.eventId) url.searchParams.set("event", selection.eventId);
      else url.searchParams.delete("event");
      url.hash = "explore";
      window.history.pushState(null, "", url);
    }
    const destination = root
      ?.querySelector(".map-surface")
      ?.getBoundingClientRect();
    if (
      !root ||
      !layer ||
      !from ||
      !destination ||
      reduced ||
      typeof Element.prototype.animate !== "function"
    )
      return;
    const sheet = layer.querySelector<HTMLElement>(".continuity-sheet"),
      veil = layer.querySelector<HTMLElement>(".continuity-veil");
    if (!sheet || !veil || destination.width <= 0) return;
    sheet.style.left = destination.left + "px";
    sheet.style.top = destination.top + "px";
    sheet.style.width = destination.width + "px";
    sheet.style.height = destination.height + "px";
    layer.hidden = false;
    root.dataset.entryMotion = "running";
    const dx = from.left - destination.left,
      dy = from.top - destination.top;
    const mobile = window.matchMedia("(max-width: 760px)").matches,
      duration = entryDuration(mobile);
    const camera = root.querySelector(".map-surface .atlas-camera");
    void director.play(
      "entry",
      [
        {
          element: sheet,
          keyframes: createEntryKeyframes({
            fromX: dx,
            fromY: dy,
            scaleX: from.width / destination.width,
            scaleY: from.height / destination.height,
          }),
          options: { duration, easing: ENTRY_EASING },
        },
        {
          element: sheet,
          keyframes: createEntryOpacityKeyframes(),
          options: { duration, easing: "linear" },
        },
        {
          element: veil,
          keyframes: [
            { opacity: 0.78, clipPath: "ellipse(75% 95% at 90% 40%)" },
            { opacity: 0, clipPath: "ellipse(140% 140% at 50% 50%)" },
          ],
          options: { duration, easing: ENTRY_EASING },
        },
        // The existing CSS dims the live atlas to .2 while entering. Restore
        // it continuously before removing that marker to avoid a final flash.
        ...(camera ? [{
          element: camera,
          keyframes: createEntryOpacityKeyframes(true),
          options: { duration, easing: "linear" },
        }] : []),
      ],
      () => {
        layer.hidden = true;
        delete root.dataset.entryMotion;
      },
    );
  };
  const act = (action: ExplorerAction) => {
    director.cancel("entry");
    dispatch(action);
  };
  const skip = () => {
    const entering = shell.current?.dataset.entryMotion === "running";
    director.cancelAll("skipped");
    if (entering)
      shell.current
        ?.querySelector<HTMLElement>("#explore-title")
        ?.focus({ preventScroll: true });
  };
  const home = () => {
    director.cancelAll();
    window.scrollTo({ top: 0, behavior: "instant" });
    shell.current
      ?.querySelector<HTMLElement>(".brand")
      ?.focus({ preventScroll: true });
  };
  return { enter, act, skip, home };
}
