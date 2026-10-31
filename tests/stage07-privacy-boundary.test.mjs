import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readTeamContent, projectPublicTeamContent } from "../scripts/team-content-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("public team payload uses anonymous creator labels and excludes personal media", async () => {
  const source = await readFile(path.join(root, "content/release/team.json"), "utf8");
  const team = readTeamContent(root);
  const projected = projectPublicTeamContent(team);
  assert.equal(team.members.length, 9);
  assert.ok(team.members.every((member, index) => member.displayName === "创作者" + String(index + 1).padStart(2, "0")));
  assert.ok(projected.members.every((member) => !("displayPreference" in member) && !("confirmedVersion" in member)));
  assert.deepEqual(projected.audio, []);
  assert.deepEqual(projected.media, []);
  assert.deepEqual(projected.records, []);
  assert.doesNotMatch(source, /team\/audio|team\/collective|team\/dev-story|previousPractice|learningText/);
});

test("contemporary page has no personal media, original identity query, or internal review controls", async () => {
  const source = await readFile(path.join(root, "src/components/ContemporarySection.tsx"), "utf8");
  assert.doesNotMatch(source, /TeamAudioPlayer|DevStoryPlayer|TeamGallery|searchParams\.get\("member"\)|a2-review-candidate|本人修改与确认/);
  assert.match(source, /get\("creator"\)/);
  assert.match(source, /匿名共创手记/);
});

test("public source tree contains only the approved music pair and no excluded personal media", async () => {
  for (const relative of ["public/team", "private-member-identity-dictionary.json"]) {
    await assert.rejects(stat(path.join(root, relative)), { code: "ENOENT" });
  }
  assert.deepEqual((await readdir(path.join(root, "public/music"))).sort(), ["footprints-war.m4a", "footprints-war.opus"]);
  const introFiles = await readdir(path.join(root, "public/intro"));
  assert.ok(introFiles.length > 0);
});
