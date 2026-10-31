import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRecommendedRoute } from "../src/history/recommendedRoute.ts";
test("推荐路线保持七个核心体验步骤并标出当前模式可用性", () => {
  const route = buildRecommendedRoute({ schoolEventId: "ev-school", imageId: "img-1", imageEventId: "ev-image", organizationEventId: "ev-org", dossierAvailable: true });
  assert.deepEqual(route.map((step) => step.id), ["home", "map", "archive", "image", "organization", "dossier", "ending"]);
  assert.ok(route.every((step) => step.available));
  assert.equal(route.find((step) => step.id === "image").target, "ev-image");
  const empty = buildRecommendedRoute({ schoolEventId: null, imageId: null, organizationEventId: null, dossierAvailable: false });
  assert.equal(empty.filter((step) => step.available).length, 2);
  assert.equal(empty.find((step) => step.id === "ending").target, "contemporary");
  assert.ok(empty.every((step) => step.label && step.description));
});
