// Only the home-to-explorer camera uses this timing. Comparison variants are
// injected by the Playwright recorder, never by product controls or URL flags.
export const ENTRY_DURATION_SCALE = 1.25;
export const ENTRY_EASING = "cubic-bezier(.30,0,.26,1)";

export function entryDuration(mobile: boolean): number {
  return Math.round((mobile ? 740 : 1020) * ENTRY_DURATION_SCALE);
}

export function createEntryOpacityKeyframes(map = false): Keyframe[] {
  // Retain the travelling sheet while it gains momentum, then hand over to
  // the live atlas. Both end with zero opacity velocity; cancellation is still
  // owned by MotionDirector, including the live atlas opacity override.
  const initial = map ? 0.2 : 1;
  return [
    { opacity: initial, offset: 0 },
    { opacity: initial, offset: 0.7, easing: "cubic-bezier(.42,0,.58,1)" },
    { opacity: map ? 1 : 0, offset: 1 },
  ];
}

export function createEntryKeyframes({
  fromX,
  fromY,
  scaleX,
  scaleY,
}: {
  fromX: number;
  fromY: number;
  scaleX: number;
  scaleY: number;
}): Keyframe[] {
  return [
    {
      transform:
        "translate(" + fromX + "px," + fromY + "px) scale(" + scaleX + "," + scaleY + ") rotate(-5deg)",
      offset: 0,
    },
    { transform: "none", offset: 1 },
  ];
}
