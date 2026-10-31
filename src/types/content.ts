export type ReviewStatus = "draft" | "pending" | "approved" | "adopted" | "rejected";
export interface Review {
  status: ReviewStatus;
  isMock: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNote: string;
  adoptionPolicyId?: string;
}
export interface Period {
  id: string;
  range: string;
  title: string;
  note: string;
}
export interface Place extends Review {
  id: string;
  name: string;
  schematic: { x: number; y: number };
  geography: { latitude: number; longitude: number; sourceId: string } | null;
  originalLabel?: string;
  placeType?: string;
  locationPrecision?: string;
  eventIds?: string[];
  relationIds?: string[];
  description?: string;
  sourceIds?: string[];
  periodLayouts?: Record<string, { x: number; y: number }>;
}
export interface Source extends Review {
  id: string;
  title: string;
  creator: string;
  url: string | null;
  locator: string;
  sourceType:
    | "book"
    | "article"
    | "archive"
    | "archive-index"
    | "team-manuscript"
    | "web-page"
    | "newspaper"
    | "official-web"
    | "oral-history"
    | "placeholder";
  titleLabel?: string;
  author?: string | null;
  authors?: string[];
  publisher?: string | null;
  publicationDate?: string | null;
  relatedEventIds?: string[];
  citedViaSourceIds?: string[];
  provenance?: {
    id: string;
    fileName: string;
    locator: string;
    recordLabel: string | null;
    sourceIds: string[];
  }[];
}
export interface Media {
  id: string;
  type: "image" | "audio";
  path: string;
  alt: string;
  sourceId: string;
  rights: string;
  title?: string;
  caption?: string;
  historicalDate?: string;
  imageCategory?: string;
  originInstitution?: string;
  originalPageUrl?: string;
  width?: number;
  height?: number;
}
export interface HistoryEvent extends Review {
  id: string;
  periodId: string;
  title: string;
  date: { label: string; start: string | null; end: string | null };
  placeIds: string[];
  participants: string[];
  factSummary: string;
  historicalSignificance: string;
  learningReflection: string;
  sourceIds: string[];
  media: Media[];
  eventType?: string;
  placeRoles?: { placeId: string; role: string; basis: string }[];
  relationIds?: string[];
  summary?: string;
  displayText?: string | null;
  bodyMode?: "display-copy" | "received-excerpt";
  archiveBlocks?: {
    id: string;
    kind: string;
    text: string;
    provenanceIds: string[];
  }[];
  provenance?: {
    id: string;
    fileName: string;
    locator: string;
    recordLabel: string | null;
    sourceIds: string[];
  }[];
  editorialStatus?: string;
  publicationReady?: boolean;
  viewModes?: string[];
  assetCount?: number;
  assetCandidateCount?: number;
  people?: { name: string; role: string; sourceIds: string[] }[];
  supplements?: { title: string; text: string; sourceIds: string[] }[];
  historyTrack?: "party" | "school" | "context";
}
export interface Relation extends Review {
  id: string;
  kind: "relocation" | "organization-link";
  periodId: string;
  fromPlaceId: string;
  toPlaceId: string;
  eventIds: string[];
  sourceIds: string[];
  sequence: number | null;
  subtype?: string;
  scopeId?: string;
  occurred?: boolean;
  renderAsTravel?: boolean;
  geometryBasis?: string;
  label?: string;
  statusNote?: string | null;
}
export interface ContentBundle {
  events: HistoryEvent[];
  places: Place[];
  sources: Source[];
  relations: Relation[];
}
