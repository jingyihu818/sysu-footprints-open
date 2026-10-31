import { fileURLToPath } from "node:url";
import { readBundle } from "./content-policy.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
for (const [dir, release] of [["content/release", true]]) {
  const bundle = readBundle(root + dir, { release });
  console.log(
    "PASS " +
      dir +
      "：" +
      bundle.events.length +
      " 个事件，" +
      bundle.places.length +
      " 个地点，" +
      bundle.sources.length +
      " 个来源，" +
      bundle.relations.length +
      " 个关系",
  );
}
