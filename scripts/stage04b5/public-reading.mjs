/** Public reading copy is separate from acquisition and adoption audit notes. */
export function projectReadingSources(sources) {
  return sources.map((source) => ({
    id: source.id,
    status: source.status,
    isMock: source.isMock,
    title: source.title,
    ...(source.titleLabel === undefined ? {} : { titleLabel: source.titleLabel }),
    creator: source.creator,
    ...(source.author === undefined ? {} : { author: source.author }),
    ...(source.authors === undefined ? {} : { authors: source.authors }),
    ...(source.publisher === undefined ? {} : { publisher: source.publisher }),
    ...(source.publicationDate === undefined ? {} : { publicationDate: source.publicationDate }),
    url: source.url,
    locator: source.locator,
    sourceType: source.sourceType,
    ...(source.relatedEventIds === undefined ? {} : { relatedEventIds: source.relatedEventIds }),
    ...(source.citedViaSourceIds === undefined ? {} : { citedViaSourceIds: source.citedViaSourceIds }),
    reviewNote: "",
  }));
}

/** Keep immutable dossier texts while joining newly attached image sources. */
export function withImageSources(dossiers, events) {
  const byId=new Map(events.map(event=>[event.id,event]));
  return dossiers.map(dossier=>({...dossier,pages:dossier.pages.map(page=>({...page,
    sourceIds:[...new Set([...page.sourceIds,...page.eventIds.flatMap(id=>byId.get(id)?.sourceIds??[])])],
  }))}));
}
