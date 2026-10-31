/// <reference types="vite/client" />
declare module "virtual:intro-config" {
  export const introConfig: { enabled: boolean; mode?: "paper" | "film"; desktop: string; mobile: string; poster: string; mobilePoster?: string; durationSeconds: number };
}
declare module "virtual:history-content" {
  export const content: import("./types/content").ContentBundle;
  export const isDemo: boolean;
  export const isHistoryPreview: boolean;
}
declare module "virtual:history-preview" {
  export const historyPreview: import("./history/adapter").HistoryPreviewBundle | Record<string, never>;
  export const exhibitionExtensions: { dossiers: import("./types/exhibition").ExhibitionDossier[] };
  export const isStage04aTest: boolean;
}
declare module "virtual:history-copy" {
  export const historyCopy: Record<string, string>;
}
declare module "virtual:team-content" {
  export const teamContent: import("./team/content").PublicTeamContent;
  export const isTeamPreview: boolean;
}
declare module "virtual:stage07-reading-content" {
  export const centennialData: any;
  export const walkData: any;
}
