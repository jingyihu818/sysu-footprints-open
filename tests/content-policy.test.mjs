import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  copyFileSync,
} from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readBundle, validateBundle } from "../scripts/content-policy.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const demo = () => structuredClone(readBundle(join(root, "mock")));
const approved = () => {
  // 测试夹具：不写入正式库、不包含真实历史内容。
  const r = {
    status: "approved",
    isMock: false,
    reviewedBy: "TEST-REVIEWER",
    reviewedAt: "2026-10-14",
    reviewNote: "TEST-ONLY 审核门禁测试",
  };
  const s = {
    id: "test-source",
    title: "TEST-ONLY 来源",
    creator: "TEST-ONLY",
    url: "https://example.org/reference",
    locator: "TEST-ONLY section",
    sourceType: "official-web",
    ...r,
  };
  const p = {
    id: "test-place",
    name: "TEST-ONLY 地点",
    schematic: { x: 100, y: 100 },
    geography: null,
    ...r,
  };
  const e = {
    id: "test-event",
    periodId: "p1924",
    title: "TEST-ONLY 事件",
    date: { label: "TEST-ONLY date", start: null, end: null },
    placeIds: [p.id],
    participants: [],
    factSummary: "TEST-ONLY fixture",
    historicalSignificance: "",
    learningReflection: "",
    sourceIds: [s.id],
    media: [],
    ...r,
  };
  return { events: [e], places: [p], sources: [s], relations: [] };
};
const invalid = (name, change, regex) =>
  test(name, () => {
    const b = approved();
    change(b);
    assert.throws(() => validateBundle(b, { release: true }), regex);
  });
test("演示数据允许开发使用", () => assert.equal(demo().events.length, 10));
test("正式内容库保留本轮采用的完整历史资料", () =>
  assert.equal(
    readBundle(join(root, "content/release"), { release: true }).events.length,
    35,
  ));
test("有效审核夹具符合内容结构", () =>
  assert.equal(validateBundle(approved(), { release: true }).events.length, 1));
test("无单一地点的审核专题可经章节目录发布", () => {
  const bundle = approved();
  bundle.events[0].placeIds = [];
  assert.equal(validateBundle(bundle, { release: true }).events[0].placeIds.length, 0);
});
for (const status of ["draft", "pending", "rejected"])
  invalid(
    "拒绝发布 " + status,
    (b) => (b.events[0].status = status),
    /未获批准/,
  );
invalid("拒绝 isMock", (b) => (b.events[0].isMock = true), /MOCK/);
invalid(
  "拒绝文字中隐藏的 MOCK",
  (b) => (b.events[0].factSummary = "MOCK marker"),
  /MOCK/,
);
invalid("拒绝缺少审核人", (b) => (b.events[0].reviewedBy = null), /缺少审核人/);
invalid(
  "拒绝无效审核日期",
  (b) => (b.events[0].reviewedAt = "2026-02-30"),
  /审核元信息/,
);
invalid("拒绝事件无来源", (b) => (b.events[0].sourceIds = []), /引用列表/);
invalid("拒绝悬空引用", (b) => (b.events[0].placeIds = ["missing"]), /不存在/);
invalid("拒绝重复 ID", (b) => b.places.push(b.places[0]), /重复/);
invalid("拒绝未知章节", (b) => (b.events[0].periodId = "unknown"), /章节/);
invalid(
  "拒绝日期反转",
  (b) => (b.events[0].date = { label: "TEST", start: "1944", end: "1938" }),
  /顺序反转/,
);
invalid(
  "拒绝脚本链接",
  (b) => (b.sources[0].url = "javascript:alert(1)"),
  /原始链接/,
);
invalid("拒绝网络来源无链接", (b) => (b.sources[0].url = null), /缺少原始链接/);
invalid(
  "拒绝占位来源",
  (b) => (b.sources[0].sourceType = "placeholder"),
  /占位来源/,
);
invalid(
  "拒绝无依据地理坐标",
  (b) =>
    (b.places[0].geography = {
      latitude: 23,
      longitude: 113,
      sourceId: "missing",
    }),
  /不存在/,
);
invalid(
  "拒绝未经授权素材",
  (b) =>
    (b.events[0].media = [
      {
        id: "m",
        type: "image",
        path: "media/test.png",
        alt: "TEST",
        sourceId: "test-source",
        rights: "",
      },
    ]),
  /使用授权/,
);
invalid(
  "拒绝素材路径越界",
  (b) =>
    (b.events[0].media = [
      {
        id: "m",
        type: "image",
        path: "../private.png",
        alt: "TEST",
        sourceId: "test-source",
        rights: "TEST",
      },
    ]),
  /使用授权/,
);
test("审核事件不能依赖未审核来源（工作库也检查）", () => {
  const b = approved();
  b.sources[0].status = "pending";
  assert.throws(() => validateBundle(b), /未审核依赖/);
});
test("迁校与组织关系必须区分", () => {
  const b = approved();
  b.places.push({ ...b.places[0], id: "test-place-2" });
  const relation = {
    ...b.events[0],
    id: "test-relation",
    kind: "organization-link",
    fromPlaceId: "test-place",
    toPlaceId: "test-place-2",
    eventIds: ["test-event"],
    sequence: 1,
  };
  b.relations = [relation];
  assert.throws(() => validateBundle(b, { release: true }), /字段混用/);
  relation.sequence = null;
  validateBundle(b, { release: true });
  relation.kind = "relocation";
  relation.sequence = 0;
  validateBundle(b, { release: true });
});
for (const [label, mode, mutate, expected] of [
  [
    "production 拒绝 pending",
    "production",
    (b) => (b.events[0].status = "pending"),
    /未获批准/,
  ],
  [
    "development 模式构建也拒绝草稿",
    "development",
    (b) => (b.events[0].status = "draft"),
    /未获批准/,
  ],
  [
    "自定义模式构建也拒绝 MOCK",
    "custom",
    (b) => (b.events[0].isMock = true),
    /MOCK/,
  ],
  [
    "直接 vite build 拒绝缺失素材文件",
    "production",
    (b) =>
      (b.events[0].media = [
        {
          id: "m",
          type: "image",
          path: "media/missing.png",
          alt: "TEST",
          sourceId: "test-source",
          rights: "TEST",
        },
      ]),
    /素材文件不存在/,
  ],
])
  test("真实构建门禁：" + label, () => {
    mkdirSync(join(root, "output/policy-fixtures"), { recursive: true });
    const dir = mkdtempSync(join(root, "output/policy-fixtures/case-"));
    mkdirSync(join(dir, "scripts"), { recursive: true });
    mkdirSync(join(dir, "content/release"), { recursive: true });
    const fixtureTeam = JSON.parse(readFileSync(join(root, "content/release/team.json"), "utf8").replace(/^\uFEFF/, ""));
    fixtureTeam.audio = [];
    writeFileSync(join(dir, "content/release/team.json"), JSON.stringify(fixtureTeam));
    copyFileSync(join(root, "vite.config.mjs"), join(dir, "vite.config.mjs"));
    copyFileSync(
      join(root, "scripts/content-policy.mjs"),
      join(dir, "scripts/content-policy.mjs"),
    );
    for (const file of ["stage04a-exhibition.mjs", "stage04a-fixture.mjs", "team-content-policy.mjs"]) copyFileSync(join(root, "scripts", file), join(dir, "scripts", file));
    mkdirSync(join(dir, "scripts/stage04b5"), { recursive: true });
    copyFileSync(join(root, "scripts/stage04b5/public-reading.mjs"), join(dir, "scripts/stage04b5/public-reading.mjs"));
    const b = approved();
    mutate(b);
    for (const key of ["events", "places", "sources", "relations"])
      writeFileSync(
        join(dir, "content/release", key + ".json"),
        JSON.stringify(b[key]),
        "utf8",
      );
    const result = spawnSync(
      process.execPath,
      [
        join(root, "node_modules/vite/bin/vite.js"),
        "build",
        dir,
        "--config",
        join(dir, "vite.config.mjs"),
        "--mode",
        mode,
      ],
      { encoding: "utf8" },
    );
    writeFileSync(
      join(dir, "build.log"),
      result.stdout + result.stderr,
      "utf8",
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stdout + result.stderr, expected);
  });

test('真实发布包仅复制已引用的审核素材', () => {
  mkdirSync(join(root, 'output/policy-fixtures'), { recursive: true });
  const dir = mkdtempSync(join(root, 'output/policy-fixtures/asset-'));
  for (const folder of ['scripts', 'content/release', 'public/media']) mkdirSync(join(dir, folder), { recursive: true });
  const fixtureTeam = JSON.parse(readFileSync(join(root, 'content/release/team.json'), 'utf8').replace(/^\uFEFF/, ''));
  fixtureTeam.audio = [];
  for (const item of fixtureTeam.media ?? []) {
    mkdirSync(join(dir, 'public', item.path, '..'), { recursive: true });
    copyFileSync(join(root, 'public', item.path), join(dir, 'public', item.path));
  }
  writeFileSync(join(dir, 'content/release/team.json'), JSON.stringify(fixtureTeam));
  copyFileSync(join(root, 'vite.config.mjs'), join(dir, 'vite.config.mjs'));
  copyFileSync(join(root, 'scripts/content-policy.mjs'), join(dir, 'scripts/content-policy.mjs'));
  for (const file of ['stage04a-exhibition.mjs', 'stage04a-fixture.mjs', 'team-content-policy.mjs']) copyFileSync(join(root, 'scripts', file), join(dir, 'scripts', file));
  mkdirSync(join(dir, 'scripts/stage04b5'), { recursive: true });
  copyFileSync(join(root, 'scripts/stage04b5/public-reading.mjs'), join(dir, 'scripts/stage04b5/public-reading.mjs'));
  copyFileSync(join(root, 'public/favicon.svg'), join(dir, 'public/favicon.svg'));
  copyFileSync(join(root, 'public/sysu-emblem-red.png'), join(dir, 'public/sysu-emblem-red.png'));
  const b = approved();
  b.events[0].media = [{ id: 'test-media', type: 'image', path: 'media/approved.png', alt: 'TEST ONLY synthetic pixel', sourceId: 'test-source', rights: 'TEST ONLY generated fixture' }];
  const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJx8AAAAASUVORK5CYII=', 'base64');
  writeFileSync(join(dir, 'public/media/approved.png'), pixel);
  writeFileSync(join(dir, 'public/media/unreviewed.txt'), 'TEST ONLY unapproved asset');
  writeFileSync(join(dir, 'index.html'), '<html><script type="module" src="/main.js"></script></html>');
  writeFileSync(join(dir, 'main.js'), 'import {content} from "virtual:history-content"; document.body.textContent=JSON.stringify(content);');
  for (const key of ['events', 'places', 'sources', 'relations']) writeFileSync(join(dir, 'content/release', key + '.json'), JSON.stringify(b[key]), 'utf8');
  const result = spawnSync(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), 'build', dir, '--config', join(dir, 'vite.config.mjs')], { cwd: dir, encoding: 'utf8' });
  writeFileSync(join(dir, 'build.log'), result.stdout + result.stderr, 'utf8');
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.deepEqual(readFileSync(join(dir, 'dist/media/approved.png')), pixel);
  for (const item of fixtureTeam.media ?? []) assert.deepEqual(readFileSync(join(dir, 'dist', item.path)), readFileSync(join(root, 'public', item.path)));
  assert.throws(() => readFileSync(join(dir, 'dist/media/unreviewed.txt')), /ENOENT/);
});
