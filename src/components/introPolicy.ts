export function shouldShowFirstVisitIntro({
  enabled,
  reducedMotion,
  search,
  hash,
  alreadySeen,
}: {
  enabled: boolean;
  reducedMotion: boolean;
  search: string;
  hash: string;
  alreadySeen: boolean;
}) {
  if (!enabled || reducedMotion || alreadySeen || hash) return false;
  const params = new URLSearchParams(search);
  if (params.has("chapter") || params.has("feature") || params.has("member") || params.has("event") || params.has("place") || params.has("dossier")) return false;
  return true;
}
