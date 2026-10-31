import { useEffect } from "react";
import type { RefObject } from "react";
import type { MotionDirector } from "./director";
export function useAtmosphere(
  root: RefObject<HTMLDivElement | null>,
  director: MotionDirector,
  reduced: boolean,
) {
  useEffect(() => {
    const shell = root.current,
      hero = shell?.querySelector<HTMLElement>(".hero");
    if (
      !shell ||
      !hero ||
      reduced ||
      typeof IntersectionObserver !== "function"
    )
      return;
    let frame = 0,
      visible = true,
      x = 0,
      y = 0,
      progress = 0;
    const render = () => {
      frame = 0;
      hero.style.setProperty("--pointer-x", String(x));
      hero.style.setProperty("--pointer-y", String(y));
      hero.style.setProperty("--hero-depth", String(progress));
    };
    const schedule = () => {
      if (visible && !frame) frame = requestAnimationFrame(render);
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x = (event.clientX / window.innerWidth - 0.5) * 2;
      y = (event.clientY / window.innerHeight - 0.5) * 2;
      schedule();
    };
    const leave = () => {
      x = y = 0;
      schedule();
    };
    const scroll = () => {
      progress = Math.min(
        1,
        Math.max(0, window.scrollY / Math.max(1, window.innerHeight)),
      );
      schedule();
    };
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (fine) {
      hero.addEventListener("pointermove", pointer, { passive: true });
      hero.addEventListener("pointerleave", leave);
    }
    window.addEventListener("scroll", scroll, { passive: true });
    const visibility = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (visible) schedule();
    });
    visibility.observe(hero);
    const opening = hero.querySelector<HTMLElement>(".hero-copy");
    const light = hero.querySelector<HTMLElement>(".hero-observation-light");
    if (opening && light)
      void director.play("opening", [
        {
          element: opening,
          keyframes: [
            { transform: "translateY(26px)", opacity: 0.4 },
            { transform: "none", opacity: 1 },
          ],
          options: { duration: 880 },
        },
        {
          element: light,
          keyframes: [
            { transform: "translateX(-16%)", opacity: 0.1 },
            { transform: "translateX(0)", opacity: 0.55 },
          ],
          options: { duration: 1800 },
        },
      ]);
    const reveals = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            const element = entry.target;
            reveals.unobserve(element);
            void director.play("reveal-" + element.id, [
              {
                element,
                keyframes: [
                  { transform: "translateY(22px)", opacity: 0.7 },
                  { transform: "none", opacity: 1 },
                ],
                options: { duration: 700 },
              },
            ]);
          }
      },
      { threshold: 0.16 },
    );
    for (const element of shell.querySelectorAll("[data-scene-reveal]"))
      reveals.observe(element);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      hero.removeEventListener("pointermove", pointer);
      hero.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", scroll);
      visibility.disconnect();
      reveals.disconnect();
      director.cancel("opening");
      hero.style.removeProperty("--pointer-x");
      hero.style.removeProperty("--pointer-y");
      hero.style.removeProperty("--hero-depth");
    };
  }, [root, director, reduced]);
}
