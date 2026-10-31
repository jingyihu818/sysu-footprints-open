const pick = (value, fields) => Object.fromEntries(fields
  .filter((field) => value[field] !== undefined)
  .map((field) => [field, value[field]]));

function projectDate(value) {
  return value ? pick(value, ["label", "start", "end"]) : value;
}

export function projectPublicBundle(bundle) {
  return {
    events: bundle.events.map((event) => ({
      ...pick(event, [
        "id", "status", "isMock", "periodId", "title", "placeIds", "participants",
        "factSummary", "historicalSignificance", "learningReflection", "sourceIds",
        "eventType", "relationIds", "summary", "displayText", "bodyMode",
        "editorialStatus", "viewModes", "historyTrack",
      ]),
      date: projectDate(event.date),
      media: [],
      ...(event.placeRoles === undefined ? {} : { placeRoles: event.placeRoles.map((role) => pick(role, ["placeId", "role", "basis"])) }),
      ...(event.archiveBlocks === undefined ? {} : { archiveBlocks: event.archiveBlocks.map((block) => pick(block, ["id", "kind", "text"])) }),
      ...(event.people === undefined ? {} : { people: event.people.map((person) => pick(person, ["name", "role", "sourceIds"])) }),
      ...(event.supplements === undefined ? {} : { supplements: event.supplements.map((item) => pick(item, ["title", "text", "sourceIds"])) }),
    })),
    places: bundle.places.map((place) => ({
      ...pick(place, [
        "id", "name", "originalLabel", "placeType", "locationPrecision", "eventIds",
        "relationIds", "description", "sourceIds", "periodLayouts",
      ]),
      schematic: pick(place.schematic, ["x", "y"]),
      geography: place.geography ? pick(place.geography, ["latitude", "longitude", "sourceId"]) : null,
    })),
    sources: bundle.sources.map((source) => pick(source, [
      "id", "status", "isMock", "title", "titleLabel", "creator", "author", "authors",
      "publisher", "publicationDate", "url", "locator", "sourceType", "relatedEventIds",
      "citedViaSourceIds",
    ])),
    relations: bundle.relations.map((relation) => pick(relation, [
      "id", "status", "isMock", "kind", "periodId", "fromPlaceId", "toPlaceId",
      "eventIds", "sourceIds", "sequence", "subtype", "scopeId", "occurred",
      "renderAsTravel", "geometryBasis", "label", "statusNote",
    ])),
  };
}

export function projectPublicCentennial(value) {
  if (!value || !Array.isArray(value.excerpts) || !Array.isArray(value.milestones) || !Array.isArray(value.images)) {
    throw new Error("百年回望公开数据结构无效");
  }
  return {
    ...pick(value, ["sourceUrl", "sourceTitle", "intro", "letterSummary"]),
    excerpts: value.excerpts.map((excerpt) => typeof excerpt === "string" ? excerpt : ""),
    images: [],
    milestones: value.milestones.map((milestone) => pick(milestone, ["year", "title", "text", "eventId", "sourceUrl"])),
  };
}

export function projectPublicExploration(value) {
  if (!value || !Array.isArray(value.steps)) throw new Error("空间叙事公开数据结构无效");
  return {
    ...pick(value, ["title", "description"]),
    steps: value.steps.map((step) => pick(step, ["id", "title", "date", "text", "placeId", "eventId", "sourceIds"])),
  };
}

export function projectPublicDossiers(dossiers) {
  if (!Array.isArray(dossiers)) throw new Error("公开卷宗必须为数组");
  return dossiers.map((dossier) => ({
    ...pick(dossier, ["id", "periodId", "title", "status"]),
    pages: (dossier.pages ?? []).map((page) => pick(page, [
      "id", "order", "title", "eventIds", "sourceIds", "placeIds", "editorialStatus", "previousId", "nextId",
    ])),
  }));
}
