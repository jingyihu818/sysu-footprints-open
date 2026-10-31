export interface HistoryWalkStep {
  id: string; date: string; title: string; text: string; placeId: string; eventId: string; sourceIds: string[];
}
export interface HistoryWalk {
  title: string; description: string; steps: HistoryWalkStep[];
}
export function walkIndex(index: number, direction: "next" | "previous" | "first" | "last", count: number) {
  if (count < 1) return 0;
  if (direction === "first") return 0;
  if (direction === "last") return count - 1;
  return Math.max(0, Math.min(count - 1, index + (direction === "next" ? 1 : -1)));
}
