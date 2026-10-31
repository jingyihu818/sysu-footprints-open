const reviewed = { status: "approved", isMock: false, reviewedBy: "TEST ONLY synthetic fixture", reviewedAt: "2026-10-16", reviewNote: "TEST ONLY non-historical engineering fixture; never for publication" };
const source = (id) => ({ id, title: "TEST ONLY synthetic source " + id, creator: "TEST ONLY", url: "https://example.invalid/stage04a-test", locator: "TEST ONLY fixture", sourceType: "official-web", ...reviewed });
const event = (id, periodId, title, placeIds, sourceId, viewModes = [], media = []) => ({ id, periodId, title: "TEST ONLY synthetic " + title, date: { label: "TEST ONLY · not a date", start: null, end: null }, placeIds, participants: [], factSummary: "TEST ONLY synthetic fixture; contains no historical assertion.", historicalSignificance: "", learningReflection: "", sourceIds: [sourceId], media, viewModes, ...reviewed });
export function createStage04aFixture() {
  const bundle = {
    events: [
      event("STAGE04A-TEST-NO-PLACE", "p1924", "topic without a location", [], "STAGE04A-TEST-SOURCE-1"),
      event("STAGE04A-TEST-SCHOOL", "p1938", "school view", ["STAGE04A-TEST-PLACE-1"], "STAGE04A-TEST-SOURCE-1", ["school"]),
      event("STAGE04A-TEST-ORG", "p1938", "organization view", ["STAGE04A-TEST-PLACE-2"], "STAGE04A-TEST-SOURCE-2", ["organization"]),
      event("STAGE04A-TEST-DOSSIER", "p1947", "dossier page", ["STAGE04A-TEST-PLACE-1"], "STAGE04A-TEST-SOURCE-2", [], [{ id:"STAGE04A-TEST-IMAGE", type:"image", path:"media/stage04a-test.png", alt:"TEST ONLY generated one-pixel image", sourceId:"STAGE04A-TEST-SOURCE-2", rights:"TEST ONLY generated, no persons or historical claim" }]),
    ],
    places: [
      { id:"STAGE04A-TEST-PLACE-1", name:"TEST ONLY schematic place A", schematic:{x:220,y:180}, geography:null, ...reviewed },
      { id:"STAGE04A-TEST-PLACE-2", name:"TEST ONLY schematic place B", schematic:{x:500,y:300}, geography:null, ...reviewed },
    ],
    sources: [source("STAGE04A-TEST-SOURCE-1"), source("STAGE04A-TEST-SOURCE-2")],
    relations: [{ id:"STAGE04A-TEST-RELATION", kind:"relocation", periodId:"p1938", fromPlaceId:"STAGE04A-TEST-PLACE-1", toPlaceId:"STAGE04A-TEST-PLACE-2", eventIds:["STAGE04A-TEST-SCHOOL"], sourceIds:["STAGE04A-TEST-SOURCE-1"], sequence:0, subtype:"actual-relocation", occurred:true, renderAsTravel:false, ...reviewed }],
  };
  const pageIds = Array.from({length:6},(_,i)=>"STAGE04A-TEST-PAGE-"+(i+1));
  const dossiers = [{ id:"STAGE04A-TEST-DOSSIER-SET", periodId:"p1947", title:"TEST ONLY six-page dossier", status:"approved", reviewedBy:"TEST ONLY synthetic fixture", reviewedAt:"2026-10-16", reviewNote:"TEST ONLY non-historical engineering fixture", pages:pageIds.map((id,i)=>({ id, order:i+1, title:"TEST ONLY synthetic page "+(i+1), eventIds:["STAGE04A-TEST-DOSSIER"], sourceIds:["STAGE04A-TEST-SOURCE-2"], placeIds:[], editorialStatus:"approved", previousId:i?pageIds[i-1]:null, nextId:i<5?pageIds[i+1]:null })) }];
  return { bundle, dossiers, assets: new Map([["media/stage04a-test.png", Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJx8AAAAASUVORK5CYII=", "base64")]]) };
}
