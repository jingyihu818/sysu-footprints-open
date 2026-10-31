export interface Selection {
  periodId: string;
  placeId: string | null;
  eventId: string | null;
  viewMode?: "school" | "organization";
}
export interface ExplorerState extends Selection {
  drawerOpen: boolean;
  entryMode: "start" | "free" | null;
  history: Selection[];
  viewMode: "school" | "organization";
  mediaId: string | null;
  sourceIds: string[] | null;
  dossierPage: number | null;
}
export type ExplorerAction =
  | { type: "RESTORE"; state: ExplorerState }
  | { type: "PERIOD"; periodId: string }
  | { type: "PLACE"; placeId: string; eventId: string | null }
  | { type: "EVENT"; eventId: string }
  | { type: "ENTER"; mode: "start" | "free"; selection?: { periodId: string; eventId: string | null } }
  | { type: "VIEW"; viewMode: "school" | "organization"; placeId: string | null; eventId: string | null }
  | { type: "DOSSIER_PAGE"; pageIndex: number; eventId: string }
  | { type: "OPEN_MEDIA"; mediaId: string }
  | { type: "OPEN_SOURCE"; sourceIds?: string[] }
  | { type: "BACK" | "RESET" | "CLOSE_SOURCE" | "CLOSE_MEDIA" | "CLOSE_DOSSIER" };
export const initialState: ExplorerState = {
  periodId: "p1924",
  placeId: null,
  eventId: null,
  drawerOpen: false,
  entryMode: null,
  history: [],
  viewMode: "school",
  mediaId: null,
  sourceIds: null,
  dossierPage: null,
};
const clearOverlays = { drawerOpen: false, mediaId: null, sourceIds: null, dossierPage: null };
function select(state: ExplorerState, next: Selection): ExplorerState {
  if (
    state.periodId === next.periodId &&
    state.placeId === next.placeId &&
    state.eventId === next.eventId &&
    state.viewMode === (next.viewMode ?? state.viewMode)
  )
    return { ...state, ...clearOverlays };
  const previous = {
    periodId: state.periodId,
    placeId: state.placeId,
    eventId: state.eventId,
    viewMode: state.viewMode,
  };
  return {
    ...state,
    ...next,
    ...clearOverlays,
    viewMode: next.viewMode ?? state.viewMode,
    history: [...state.history, previous],
  };
}
export function explorerReducer(
  state: ExplorerState,
  action: ExplorerAction,
): ExplorerState {
  switch (action.type) {
    case "RESTORE":
      return { ...action.state, drawerOpen: false, mediaId: null, sourceIds: null };
    case "PERIOD":
      return select(state, {
        periodId: action.periodId,
        placeId: null,
        eventId: null,
        viewMode: "school",
      });
    case "PLACE":
      return select(state, {
        periodId: state.periodId,
        placeId: action.placeId,
        eventId: action.eventId,
      });
    case "EVENT":
      return select(state, {
        periodId: state.periodId,
        placeId: state.placeId,
        eventId: action.eventId,
      });
    case "ENTER":
      return {
        ...initialState,
        periodId: action.mode === "start" ? "p1924" : state.periodId,
        ...action.selection,
        entryMode: action.mode,
      };
    case "OPEN_SOURCE":
      return state.eventId ? { ...state, drawerOpen: true, sourceIds: action.sourceIds ?? null } : state;
    case "CLOSE_SOURCE":
      return { ...state, drawerOpen: false, sourceIds: null };
    case "OPEN_MEDIA":
      return state.eventId ? { ...state, mediaId: action.mediaId } : state;
    case "CLOSE_MEDIA":
      return { ...state, mediaId: null };
    case "VIEW":
      return select(state, {periodId: state.periodId, placeId: action.placeId, eventId: action.eventId, viewMode: action.viewMode});
    case "DOSSIER_PAGE":
      if (state.periodId !== "p1947" || !Number.isInteger(action.pageIndex) || action.pageIndex < 0 || action.pageIndex > 5) return state;
      return { ...state, ...clearOverlays, placeId: null, eventId: action.eventId, dossierPage: action.pageIndex };
    case "CLOSE_DOSSIER":
      return { ...state, ...clearOverlays, eventId: null, placeId: null };
    case "BACK": {
      const previous = state.history.at(-1);
      return previous
        ? {
            ...state,
            ...previous,
            ...clearOverlays,
            viewMode: previous.viewMode ?? "school",
            history: state.history.slice(0, -1),
          }
        : { ...state, ...clearOverlays };
    }
    case "RESET":
      return { ...initialState, entryMode: state.entryMode };
  }
}
