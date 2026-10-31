import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const releaseRoot = path.join(root, "content", "release");
const jsonOptions = { encoding: "utf8" };

function readJson(file) {
  return JSON.parse(readFileSync(file, jsonOptions).replace(/^\uFEFF/, ""));
}

function writeJson(file, value) {
  writeFileSync(file, JSON.stringify(value, null, 2) + "\n", { encoding: "utf8" });
}

const eventsPath = path.join(releaseRoot, "events.json");
const events = readJson(eventsPath);
let clearedEventMedia = 0;
let clearedMediaItems = 0;
for (const event of events) {
  if (!Array.isArray(event.media) || event.media.length === 0) continue;
  clearedEventMedia += 1;
  clearedMediaItems += event.media.length;
  event.media = [];
}
writeJson(eventsPath, events);

const centennialPath = path.join(releaseRoot, "centennial.json");
const centennial = readJson(centennialPath);
const clearedCentennialImages = Array.isArray(centennial.images) ? centennial.images.length : 0;
centennial.images = [];
writeJson(centennialPath, centennial);

const excludedCopies = [
  "public/history/stage04b3/hist-1927-journal-contents.webp",
  "public/history/stage04b3/hist-1927-renaming-letter.webp",
  "public/history/stage04b3/hist-1928-renaming-letter.webp",
  "public/history/stage04b3/hist-1939-du-westward.webp",
].map((relative) => path.join(root, ...relative.split("/")));
for (const file of excludedCopies) {
  if (!existsSync(file)) throw new Error("预期删除的公开副本不存在：" + file);
  unlinkSync(file);
}

console.log(JSON.stringify({ clearedEventMedia, clearedMediaItems, clearedCentennialImages, removedCopies: excludedCopies.length }, null, 2));
