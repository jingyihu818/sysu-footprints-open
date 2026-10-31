import type { ContentBundle, Period } from "./content";
import type { HistoricalImage } from "../history/media";
export interface ExhibitionDossierPage { id: string; order: number; title: string; eventIds: string[]; sourceIds: string[]; placeIds: string[]; editorialStatus: string; previousId: string | null; nextId: string | null; }
export interface ExhibitionDossier { id: string; periodId: string; title: string; pages: ExhibitionDossierPage[]; reviewedBy?: string; reviewedAt?: string; reviewNote?: string; status?: string; }
export interface ExhibitionBundle extends ContentBundle { mode: "release" | "history-preview" | "synthetic-test"; chapters: Period[]; images: HistoricalImage[]; dossiers: ExhibitionDossier[]; }
