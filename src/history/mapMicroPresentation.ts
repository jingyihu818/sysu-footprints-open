import type { Place } from "../types/content";
import walk from "../../content/release/exploration.json";

type Point = { x: number; y: number };
type Layout = Point & { label?: "above" | "below"; weight?: "primary" | "context" };

// Display coordinates only. Release records and other periods remain untouched.
const layouts: Record<string, Record<string, Layout>> = {
  p1924: {
    "pl-stage05e-wenming-campus": { x: 300, y: 174, label: "above", weight: "primary" },
    "pl-stage05e-old-campus": { x: 436, y: 244, weight: "primary" },
    "pl-wenming-hall": { x: 505, y: 118, label: "above" },
    "pl-stage05e-ground": { x: 235, y: 306 },
    "pl-stage05e-shaji": { x: 525, y: 368 },
  },
  p1927: {
    "pl-stage05e-old-campus": { x: 270, y: 205, label: "above", weight: "primary" },
    "pl-guangzhou": { x: 530, y: 129 },
    "pl-stage05e-honghuagang": { x: 437, y: 337, weight: "context" },
  },
  p1947: {
    "pl-stage05e-shipai": { x: 190, y: 99, label: "above", weight: "primary" },
    "pl-stage05e-gym": { x: 91, y: 170 },
    "pl-stage05e-arts": { x: 380, y: 62 },
    "pl-stage05e-pingshantang": { x: 320, y: 201, label: "above", weight: "primary" },
    "pl-stage05e-huiai-yonghan": { x: 508, y: 167, label: "above" },
    "pl-stage05e-gaodi-weixin": { x: 592, y: 264 },
    "pl-stage05e-yide-jinghai": { x: 465, y: 318 },
    "pl-changdi": { x: 308, y: 358 },
    "pl-stage05e-yijing": { x: 252, y: 294, label: "above" },
    "pl-stage05e-bank-haizhu": { x: 115, y: 337, weight: "primary" },
    "pl-stage05e-hongkong": { x: 558, y: 405, weight: "context" },
    "pl-guangzhou": { x: 565, y: 70, weight: "context" },
  },
};

export function microLayout(periodId: string, placeId: string) {
  return layouts[periodId]?.[placeId];
}

type Thread = { from: string; to: string; bend: number; kind: "reading" | "sequence" | "return" };

export function microThreads(periodId: string, places: Place[]) {
  const byId = new Map(places.map(place => [place.id, place.schematic]));
  // These are chapter-reading associations, never new historical relations or routes.
  const reading: Thread[] = periodId === "p1924" ? [
    { from: "pl-stage05e-wenming-campus", to: "pl-stage05e-old-campus", bend: -30, kind: "reading" },
    { from: "pl-stage05e-wenming-campus", to: "pl-wenming-hall", bend: -38, kind: "reading" },
    { from: "pl-stage05e-old-campus", to: "pl-stage05e-ground", bend: 38, kind: "reading" },
    { from: "pl-stage05e-old-campus", to: "pl-stage05e-shaji", bend: -44, kind: "reading" },
  ] : periodId === "p1927" ? [
    // Same existing personal archive, with an explicitly named 1928 sequel.
    // A dotted reading association, not a migration or a reconstructed route.
    { from: "pl-guangzhou", to: "pl-stage05e-honghuagang", bend: -70, kind: "reading" },
  ] : periodId === "p1947" ? [
    { from: "pl-stage05e-shipai", to: "pl-stage05e-gym", bend: 24, kind: "reading" },
    { from: "pl-stage05e-shipai", to: "pl-stage05e-arts", bend: -28, kind: "reading" },
    { from: "pl-stage05e-yide-jinghai", to: "pl-changdi", bend: -22, kind: "reading" },
  ] : [];
  // Reuse the published nine-step sequence, including its two return steps.
  const sequence: Thread[] = periodId === "p1947" ? walk.steps.slice(1).map((step, i) => ({
    from: walk.steps[i].placeId,
    to: step.placeId,
    bend: [30, 34, -30, -24, 24, 30, -95, -64][i],
    kind: i >= 6 ? "return" : "sequence",
  })) : [];
  return [...reading, ...sequence].flatMap((thread, index) => {
    const from = byId.get(thread.from), to = byId.get(thread.to);
    if (!from || !to) return [];
    const dx = to.x - from.x, dy = to.y - from.y, length = Math.hypot(dx, dy) || 1;
    const control = { x: (from.x + to.x) / 2 - dy / length * thread.bend, y: (from.y + to.y) / 2 + dx / length * thread.bend };
    return [{ ...thread, id: `${periodId}-${index}`, path: `M${from.x} ${from.y} Q${control.x} ${control.y} ${to.x} ${to.y}` }];
  });
}
