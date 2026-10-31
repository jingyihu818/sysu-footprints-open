import test from "node:test";
import assert from "node:assert/strict";
import { shouldShowFirstVisitIntro } from "../src/components/introPolicy.ts";

const eligible = { enabled: true, reducedMotion: false, search: "", hash: "", alreadySeen: false };

test("first visit plays the intro once when motion is allowed", () => {
  assert.equal(shouldShowFirstVisitIntro(eligible), true);
});

test("disabled, reduced-motion, and seen sessions skip the intro", () => {
  assert.equal(shouldShowFirstVisitIntro({ ...eligible, enabled: false }), false);
  assert.equal(shouldShowFirstVisitIntro({ ...eligible, reducedMotion: true }), false);
  assert.equal(shouldShowFirstVisitIntro({ ...eligible, alreadySeen: true }), false);
});

test("share routes and in-page anchors enter their requested destination directly", () => {
  for (const key of ["chapter", "feature", "member", "event", "place", "dossier"]) {
    assert.equal(shouldShowFirstVisitIntro({ ...eligible, search: "?" + key + "=target" }), false, key);
  }
  assert.equal(shouldShowFirstVisitIntro({ ...eligible, hash: "#centennial" }), false);
});
