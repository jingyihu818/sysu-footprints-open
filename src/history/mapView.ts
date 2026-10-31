import type { HistoryEvent, Relation } from "../types/content";

export type MapViewMode = "school" | "organization";

/** Shared archive records stay reachable; only the wartime chapter is split. */
export function viewEvents<T extends HistoryEvent>(events: readonly T[], viewMode?: MapViewMode): T[] {
  return events.filter((event) =>
    !viewMode || event.periodId !== "p1938" || !event.viewModes?.length ||
    event.viewModes.includes(viewMode) || event.viewModes.includes("archive"),
  );
}

export function viewRelations<T extends Relation>(relations: readonly T[], viewMode?: MapViewMode): T[] {
  return relations.filter((relation) =>
    !viewMode || relation.periodId !== "p1938" ||
    (viewMode === "school"
      ? relation.kind === "relocation" && relation.subtype !== "organizational-contact"
      : relation.kind === "organization-link" || relation.subtype === "organizational-contact"),
  );
}

/** Input order is the editorial fallback order. Does not mutate or dispatch. */
export function selectionForView(
  events: readonly HistoryEvent[],
  viewMode: MapViewMode | undefined,
  currentPlaceId: string | null,
  currentEventId: string | null,
): { placeId: string | null; eventId: string | null } {
  const candidates = viewEvents(events, viewMode);
  const atPlace = currentPlaceId
    ? candidates.filter((event) => event.placeIds.includes(currentPlaceId))
    : [];
  const preferred = (items: HistoryEvent[]) =>
    items.find((event) => viewMode && event.viewModes?.includes(viewMode)) ?? items[0];
  if (atPlace.length) {
    const event = atPlace.find((item) => item.id === currentEventId) ?? preferred(atPlace);
    return { placeId: currentPlaceId, eventId: event.id };
  }
  const event = candidates.find((item) => item.id === currentEventId) ?? preferred(candidates);
  return { placeId: event?.placeIds[0] ?? null, eventId: event?.id ?? null };
}

export type RelationClass = "planned" | "actual" | "transit" | "dispersed" | "return" | "organization" | "context";

/** Visual encoding never infers travel from sequence, endpoints, or kind alone. */
export function relationPresentation(relation: Relation): {
  className: RelationClass; label: string; isTravel: boolean;
} {
  let className: RelationClass = "context";
  let label = relation.label ?? "历史关系（示意）";
  if (relation.kind === "organization-link" || relation.subtype === "organizational-contact") {
    className = "organization";
    label = "组织联系 · 非迁校路线";
  } else {
    switch (relation.subtype) {
      case "planned-relocation": className = "planned"; label = "计划迁校 · 未实施"; break;
      case "actual-relocation": className = "actual"; label = "实际迁校 · 关系示意"; break;
      case "transit": className = "transit"; label = "途经 · 非正式办学点"; break;
      case "dispersed-schooling": className = "dispersed"; label = "分散办学 · 独立分支"; break;
      case "return": className = "return"; label = "复员返穗 · 关系示意"; break;
    }
  }
  const isTravel = relation.occurred === true && relation.renderAsTravel === true &&
    (className === "actual" || className === "transit" || className === "return");
  return { className, label, isTravel };
}
