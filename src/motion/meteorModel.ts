export interface MeteorSpec {
  depth: "far" | "middle" | "near";
  x: number;
  y: number;
  angle: number;
  length: number;
  travel: number;
  cycle: number;
  delay: number;
  flight: number;
  light: number;
}

/** The sparse score is used by the explore transition and kept deliberately quiet. */
export const meteorScore: readonly MeteorSpec[] = [
  { depth: "far", x: -8, y: 4, angle: 31, length: 43, travel: .49, cycle: 23, delay: -2, flight: .27, light: .17 },
  { depth: "far", x: 38, y: 3, angle: 38, length: 31, travel: .41, cycle: 31, delay: 5.9, flight: .23, light: .12 },
  { depth: "far", x: 63, y: 21, angle: 34, length: 52, travel: .39, cycle: 37, delay: 12.4, flight: .2, light: .15 },
  { depth: "middle", x: 29, y: -8, angle: 35, length: 92, travel: .56, cycle: 19, delay: -.9, flight: .22, light: .34 },
  { depth: "middle", x: -10, y: 44, angle: 41, length: 74, travel: .48, cycle: 29, delay: 8.7, flight: .15, light: .28 },
  { depth: "near", x: 57, y: -12, angle: 32, length: 158, travel: .64, cycle: 43, delay: 15.2, flight: .065, light: .38 },
];

/** A fuller authored hero field. It is deterministic, layered and still sparse over time. */
export const heroMeteorScore: readonly MeteorSpec[] = [
  { depth: "far", x: -14, y: 8, angle: 29, length: 34, travel: .42, cycle: 28, delay: -1.3, flight: .16, light: .2 },
  { depth: "far", x: 12, y: 18, angle: 36, length: 28, travel: .48, cycle: 35, delay: 7.4, flight: .14, light: .16 },
  { depth: "far", x: 45, y: 4, angle: 43, length: 41, travel: .38, cycle: 31, delay: 14.8, flight: .17, light: .19 },
  { depth: "far", x: 72, y: 17, angle: 31, length: 38, travel: .52, cycle: 39, delay: 20.4, flight: .13, light: .14 },
  { depth: "far", x: 88, y: 42, angle: 47, length: 30, travel: .4, cycle: 34, delay: 3.1, flight: .15, light: .13 },
  { depth: "middle", x: -8, y: 31, angle: 34, length: 66, travel: .5, cycle: 24, delay: -3, flight: .2, light: .38 },
  { depth: "middle", x: 24, y: -7, angle: 39, length: 79, travel: .57, cycle: 29, delay: -2, flight: .18, light: .4 },
  { depth: "middle", x: 52, y: 29, angle: 28, length: 58, travel: .45, cycle: 26, delay: 18.5, flight: .21, light: .34 },
  { depth: "middle", x: 78, y: 62, angle: 42, length: 73, travel: .54, cycle: 33, delay: 26.2, flight: .16, light: .3 },
  { depth: "near", x: 4, y: 66, angle: 33, length: 121, travel: .47, cycle: 43, delay: -5, flight: .08, light: .55 },
  { depth: "near", x: 35, y: 12, angle: 45, length: 148, travel: .62, cycle: 51, delay: -7, flight: .07, light: .58 },
  { depth: "near", x: 61, y: 48, angle: 37, length: 108, travel: .58, cycle: 47, delay: 31.7, flight: .085, light: .4 },
  { depth: "near", x: 91, y: 6, angle: 30, length: 132, travel: .5, cycle: 55, delay: 16.3, flight: .075, light: .38 },
  { depth: "middle", x: 105, y: 76, angle: 40, length: 62, travel: .43, cycle: 37, delay: 36.8, flight: .14, light: .26 },
];

export function meteorTravel(spec: MeteorSpec, width: number) {
  const x = width * spec.travel;
  return { x, y: x * Math.tan(spec.angle * Math.PI / 180) };
}

/** Staggered, continuous background score, shared by the history and team scenes. */
export const ambientMeteorScore: readonly MeteorSpec[] = Array.from({ length: 18 }, (_, index) => ({
  depth: index % 6 === 5 ? "near" : index % 3 === 0 ? "middle" : "far",
  x: (index * 37 % 112) - 12,
  y: (index * 23 % 92) - 10,
  angle: 30 + index % 5 * 3,
  length: index % 6 === 5 ? 112 : index % 3 === 0 ? 78 : 48,
  travel: .34 + index % 4 * .04,
  cycle: 17 + index % 5 * 2,
  delay: -1.4 - index * 1.73,
  flight: .68,
  light: index % 6 === 5 ? .42 : index % 3 === 0 ? .34 : .23,
}));
