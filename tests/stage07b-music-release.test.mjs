import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const musicDir = path.join(root, "public", "music");
const expected = {
  "footprints-war.opus": {
    bytes: 1170119,
    sha256: "79c6b3709425d5ac97ef52934c7165e94404d868c1bc758edc4b000d5f8c90fb",
  },
  "footprints-war.m4a": {
    bytes: 1259212,
    sha256: "59d42d6683fb0a9ee29fb052689eb3081a174d16c4d327d41a733547f8be0121",
  },
};

test("public music release contains exactly the reviewed war pair", async () => {
  const names = (await readdir(musicDir)).sort();
  assert.deepEqual(names, Object.keys(expected).sort());
  for (const [name, metadata] of Object.entries(expected)) {
    const bytes = await readFile(path.join(musicDir, name));
    assert.equal(bytes.byteLength, metadata.bytes, name);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), metadata.sha256, name);
  }
});

test("public build keeps the music allowlist explicit", async () => {
  const config = await readFile(path.join(root, "vite.config.mjs"), "utf8");
  assert.doesNotMatch(config, /publicDir\s*:\s*true/);
  assert.match(config, /musicAssets/);
  assert.ok(config.includes("footprints-war"));
  assert.match(config, /404\.html/);
});

test("public App mounts one global music player", async () => {
  const app = await readFile(path.join(root, "src", "App.tsx"), "utf8");
  assert.match(app, /import MusicPlayer from ["']\.\/audio\/MusicPlayer["']/);
  assert.equal((app.match(/<MusicPlayer\s*\/>/g) ?? []).length, 1);
});
