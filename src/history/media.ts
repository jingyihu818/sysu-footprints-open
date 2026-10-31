/** Browser whitelist. Local storage paths, hashes and acquisition receipts stay server-side. */
export interface HistoricalImage {
  id: string;
  relatedEventIds: string[];
  sourceIds: string[];
  title: string;
  caption: string | null;
  alt: string;
  historicalDate: string | null;
  imageCategory: string;
  rightsStatus: string;
  rightsLabel: string;
  originInstitution: string | null;
  originalPageUrl: string | null;
  width?: number;
  height?: number;
  thumbnailUrl: string;
  displayUrl: string;
}
