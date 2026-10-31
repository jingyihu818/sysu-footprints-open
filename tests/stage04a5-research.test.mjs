import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readResearchBundle, validateResearchBundle, researchForPeriod } from "../scripts/stage04a5-research.mjs";

test("Stage04A.5 research bundle is candidate-only and keeps 1927 out of event inventory", () => {
  const bundle = readResearchBundle("content/research/stage04a5");
  validateResearchBundle(bundle, {
    eventIds: new Set(JSON.parse(readFileSync("content/staging/20261015-v1/events.json", "utf8").replace(/^\uFEFF/, "")).map((item) => item.id)),
    periodIds: new Set(["p1924", "p1927", "p1938", "p1947", "p2026"]),
  });
  assert.equal(bundle.reviewState, "candidate-only");
  assert.equal(bundle.candidates.some((item) => item.periodId === "p1927" && item.eventId), false);
  assert.ok(bundle.candidates.some((item) => item.periodId === "p1927"));
});

test("researchForPeriod returns only source-linked candidates for the selected chapter", () => {
  const bundle = readResearchBundle("content/research/stage04a5");
  const cards = researchForPeriod(bundle, "p1947");
  assert.ok(cards.length >= 2);
  assert.ok(cards.every((item) => item.periodId === "p1947" && item.sourceIds.length > 0));
});

test("invalid event references and publication-ready research fail closed", () => {
  const bundle = readResearchBundle("content/research/stage04a5");
  assert.throws(() => validateResearchBundle({ ...bundle, candidates: [{ ...bundle.candidates[0], eventId: "missing" }] }, { eventIds: new Set(["known"]), periodIds: new Set(["p1924", "p1927", "p1938", "p1947"]) }), /不存在的事件/);
  assert.throws(() => validateResearchBundle({ ...bundle, candidates: [{ ...bundle.candidates[0], publicationReady: true }] }, { eventIds: new Set(), periodIds: new Set(["p1924", "p1927", "p1938", "p1947"]) }), /publicationReady/);
});
