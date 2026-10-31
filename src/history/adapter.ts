import type {
  ContentBundle,
  HistoryEvent,
  Period,
  Place,
  Relation,
  Source,
} from "../types/content";
import historyCopy from "./copy";
import type { HistoricalImage } from "./media";

export interface HistoryPreviewChapter extends Period {
  status: string;
  eventIds: string[];
  placeIds: string[];
  sourceIds: string[];
  completeDisplayCount: number;
  publicationReady: boolean;
  hasCandidateContent: boolean;
  eventCount: number;
  placeCount: number;
  sourceCount: number;
}

export interface HistoryPreviewBundle extends ContentBundle {
  mode: "history-preview";
  stagingVersion: string;
  images?: HistoricalImage[];
  chapters: HistoryPreviewChapter[];
  gaps: {
    id: string;
    periodId: string | null;
    entityId: string | null;
    kind: string;
    reason: string;
    missingFields: string[];
  }[];
  dossiers: {
    id: string;
    periodId: string;
    title: string;
    pages: {
      id: string;
      order: number;
      title: string;
      eventIds: string[];
      sourceIds: string[];
      placeIds: string[];
      editorialStatus: string;
      previousId: string | null;
      nextId: string | null;
    }[];
  }[];
  research: {
    reviewState: "candidate-only";
    sources: { id: string; title: string; institution: string; author: string | null; date: string; url: string | null; class: string; access: string; notes: string }[];
    candidates: { id: string; periodId: string; eventId: string | null; title: string; summary: string; sourceIds: string[]; status: "candidate"; publicationReady: false; mediaIds: string[]; reviewQuestion: string }[];
    media: { id: string; candidateId: string; title: string; category: string; url: string; status: string; rightsStatus: string; previewAllowed: false; notes: string }[];
  };
}

const review = {
  status: "pending" as const,
  isMock: false,
  reviewedBy: null,
  reviewedAt: null,
  reviewNote: historyCopy.reviewNote,
};

export function toHistoryUiBundle(preview: HistoryPreviewBundle): ContentBundle {
  const places: Place[] = preview.places.map((place) => ({
    ...review,
    id: place.id,
    name: place.name,
    schematic: place.schematic,
    geography: null,
    originalLabel: place.originalLabel,
    placeType: place.placeType,
    locationPrecision: place.locationPrecision,
    eventIds: place.eventIds,
    relationIds: place.relationIds,
  }));
  const sources: Source[] = preview.sources.map((source) => ({
    ...review,
    id: source.id,
    title: source.titleLabel ?? "未提供题名",
    creator: source.author ?? source.publisher ?? "作者 / 机构未提供",
    url: source.url,
    locator: source.locator,
    sourceType: source.sourceType as Source["sourceType"],
    titleLabel: source.titleLabel,
    author: source.author,
    authors: source.authors,
    publisher: source.publisher,
    publicationDate: source.publicationDate,
    relatedEventIds: source.relatedEventIds,
    citedViaSourceIds: source.citedViaSourceIds,
    provenance: source.provenance,
  }));
  const events: HistoryEvent[] = preview.events.map((event) => ({
    ...review,
    id: event.id,
    periodId: event.periodId,
    title: event.title,
    date: event.date,
    placeIds: event.placeIds,
    participants: event.participants,
    factSummary: event.summary ?? historyCopy.factFallback,
    historicalSignificance: "",
    learningReflection: "",
    sourceIds: event.sourceIds,
    media: [],
    eventType: event.eventType,
    placeRoles: event.placeRoles,
    relationIds: event.relationIds,
    summary: event.summary,
    displayText: event.displayText,
    bodyMode: event.bodyMode,
    archiveBlocks: event.archiveBlocks,
    provenance: event.provenance,
    editorialStatus: event.editorialStatus,
    publicationReady: event.publicationReady,
    viewModes: event.viewModes,
    assetCount: event.assetCount,
    assetCandidateCount: event.assetCandidateCount,
  }));
  const relations: Relation[] = preview.relations.map((relation) => ({
    ...review,
    id: relation.id,
    kind: relation.kind,
    periodId: relation.periodId,
    fromPlaceId: relation.fromPlaceId,
    toPlaceId: relation.toPlaceId,
    eventIds: relation.eventIds,
    sourceIds: [],
    sequence: relation.sequence,
    subtype: relation.subtype,
    scopeId: relation.scopeId,
    occurred: relation.occurred,
    renderAsTravel: relation.renderAsTravel,
    geometryBasis: relation.geometryBasis,
    label: relation.label,
    statusNote: relation.statusNote,
  }));
  return { events, places, sources, relations };
}
