/** Internal candidate contract; not wired to virtual:history-content or the UI. */
import type { Review, Period, ContentBundle } from './content';
export type HistoricalPrecision = 'day' | 'month' | 'year' | 'range' | 'period' | 'unknown';
export interface HistoricalDate {
  label: string; start: string | null; end: string | null;
  precision: HistoricalPrecision;
  startPrecision: 'day' | 'month' | 'year' | null;
  endPrecision: 'day' | 'month' | 'year' | null;
  qualifier?: string; originalExpressions: string[]; normalizationBasis: string;
}
export interface Provenance {
  id: string; documentId: string; documentSha256: string;
  originalFile: string; originalPath: string; locator: string;
  originalTitle: string | null; recordLabel: string | null; processingState: string;
  characterRange: { start: number; end: number } | null;
  textSha256: string | null; externalUrls: string[]; sourceIds: string[]; assetIds: string[];
}
export interface StagingChapter extends Omit<Period, 'note'> {
  previousRange?: string; status: string; eventIds: string[];
  sourceIds: string[]; assetIds: string[]; completeDisplayCount: number; publicationReady: boolean;
}
export interface ReceivedText {
  id: string; text: string;
  excerptKind: 'received-excerpt' | 'received-summary' | 'bibliographic-description';
  provenanceIds: string[];
}
export interface StagingEvent {
  id: string; periodId: string; title: string; titleState: 'curatorial-candidate';
  eventType: string; date: HistoricalDate; placeIds: string[];
  placeRoles: { placeId: string; role: string; basis: string }[];
  locationPrecision: 'unknown' | 'named-place'; locationNote: string | null;
  participants: string[];
  participantMentions: { id: string; name: string; kind: 'person' | 'organization'; relation: string; provenanceIds: string[] }[];
  sourceIds: string[]; assetIds: string[]; assetCandidateIds: string[]; relationIds: string[];
  sourceText: ReceivedText[]; extractedSummary: string; summaryMethod: string;
  displayText: string | null; editorialStatus: 'excerpt-needs-edit' | 'summary-needs-display' | 'reference-only' | 'ready';
  historyState: 'team-delivered'; publicationReady: boolean; review: Review;
  missingFields: string[]; provenanceIds: string[]; viewModes: ('school' | 'organization' | 'archive')[];
}
export interface StagingPlace {
  id: string; name: string; originalLabel: string; placeType: string; locationPrecision: string;
  geography: { latitude: number; longitude: number; sourceId: string } | null;
  schematic: { x: number; y: number } | null;
  historicalToModernEquivalence: string | null; unresolvedLabel: boolean;
  provenanceIds: string[]; sourceIds: string[]; publicationReady: boolean;
}
export interface StagingSource {
  id: string; title: string | null; titleKind: string; sourceType: string;
  author: string | null; authors: string[]; publisher: string | null; publicationDate: string | null;
  publicationInfo: string | null; workLocator: string | null;
  originalUrl: string | null; normalizedUrl: string | null; originalUrls: string[]; normalizedUrls: string[];
  originatingDocument: string; locationInDocument: string; provenanceIds: string[];
  relatedEventIds: string[]; relatedAssetIds: string[]; citedViaSourceIds: string[];
  availability: string; publicationReady: boolean; externalAccessTested: boolean; possibleSameWorkIds: string[];
}
export interface StagingRelation {
  id: string; kind: 'relocation' | 'organization-link';
  subtype: 'planned-relocation' | 'actual-relocation' | 'transit' | 'dispersed-schooling' | 'return' | 'organizational-contact' | 'red-activity-association';
  periodId: string; fromPlaceId: string; toPlaceId: string;
  eventIds: string[]; sourceIds: string[]; provenanceIds: string[];
  sequence: number | null; scopeId: string; occurred: boolean;
  geometry: null; geometryBasis: 'schematic-order' | 'organizational-contact';
  renderAsTravel: false; publicationReady: boolean; label: string; statusNote: string | null;
}
export interface StagingAsset {
  id: string; internalResource: string; sha256: string; bytes: number;
  width: number | null; height: number | null; format: string | null;
  originalPath: string; documentId: string; documentIds: string[]; periodId: string | null; contentType: string;
  internalOnly: boolean; caption: string | null; sourceIds: string[]; provenanceIds: string[];
  relatedEventIds: string[]; originUrl: string | null; rightsEvidence: string | null;
  rightsStatus: 'unknown'; publicationReady: boolean; publicPath: string | null;
  placements: { locator: string; paragraphNumber: number | null; precedingText?: string[]; followingText?: string[] }[];
}
export interface AssetCandidate {
  id: string; label: string; sourceIds: string[]; eventIds: string[];
  localFile: null; originUrls: string[]; availability: 'link-only'; rightsStatus: 'unknown';
  publicationReady: false; provenanceIds: string[];
}
export interface DossierPage {
  id: string; order: number; title: string; eventIds: string[]; sourceIds: string[];
  assetIds: string[]; assetCandidateIds: string[]; placeIds: string[];
  sourceText: ReceivedText[]; displayText: string | null; editorialStatus: string;
  previousId: string | null; nextId: string | null; publicationReady: boolean;
}
export interface StagingDossier { id: string; periodId: string; title: string; pages: DossierPage[] }
export interface ContentGap { id: string; periodId: string | null; entityId: string | null; kind: string; reason: string; missingFields?: string[]; documentId?: string }
export interface StagingBundle {
  schemaVersion: 'stage01b.1'; chapters: StagingChapter[]; events: StagingEvent[];
  places: StagingPlace[]; sources: StagingSource[]; relations: StagingRelation[];
  assets: StagingAsset[]; assetCandidates: AssetCandidate[]; dossiers: StagingDossier[];
  gaps: ContentGap[]; provenance: Provenance[];
  sourceOccurrences: { id: string; documentId: string; locator: string; originalUrls: string[]; sourceIds: string[] }[];
  internalNotes: { id: string; documentId: string; text: string; provenanceIds: string[]; publicationReady: false }[];
}
export type LegacyReviewProjection = ContentBundle;
