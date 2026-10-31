import { readFileSync } from "node:fs";
import { join } from "node:path";
export const PERIOD_IDS = ["p1924", "p1927", "p1938", "p1947", "p2026"];
const statuses = ["draft", "pending", "approved", "adopted", "rejected"];
const groups = ["events", "places", "sources", "relations"];
const sourceTypes = [
  "book",
  "article",
  "archive",
  "official-web",
  "oral-history",
  "placeholder",
];
const assert = (ok, message) => {
  if (!ok) throw new Error(message);
};
const text = (value) => typeof value === "string" && value.trim().length > 0;
const strings = (value) =>
  Array.isArray(value) &&
  value.every(text) &&
  new Set(value).size === value.length;
const safeUrl = (value) => {
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};
const date = (value) => {
  if (!text(value) || !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(value)) return false;
  const normalized =
    value.length === 4
      ? value + "-01-01"
      : value.length === 7
        ? value + "-01"
        : value;
  const parsed = new Date(normalized + "T00:00:00Z");
  return (
    Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === normalized
  );
};
export function validateBundle(bundle, { release = false } = {}) {
  assert(bundle && typeof bundle === "object", "内容包必须为对象");
  for (const group of groups) {
    assert(Array.isArray(bundle[group]), group + " 必须为数组");
    const seen = new Set();
    for (const r of bundle[group]) {
      assert(r && typeof r === "object" && text(r.id), group + " 缺少有效 id");
      assert(!seen.has(r.id), group + " id 重复：" + r.id);
      seen.add(r.id);
      assert(
        statuses.includes(r.status) && typeof r.isMock === "boolean",
        r.id + " 审核字段无效",
      );
      assert(
        (r.reviewedBy === null || text(r.reviewedBy)) &&
          (r.reviewedAt === null ||
            (date(r.reviewedAt) && r.reviewedAt.length === 10)) &&
          typeof r.reviewNote === "string",
        r.id + " 审核元信息无效",
      );
      if (release || r.status === "approved" || r.status === "adopted") {
        assert(["approved", "adopted"].includes(r.status), r.id + " 未获批准或采用，禁止发布");
        assert(
          !r.isMock &&
            !/mock/i.test(
              JSON.stringify(r, (key, value) =>
                key === "isMock" ? undefined : value,
              ),
            ),
          r.id + " 含 MOCK，禁止发布",
        );
        if (r.status === "approved") assert(text(r.reviewedBy) && date(r.reviewedAt) && text(r.reviewNote), r.id + " 缺少审核人、审核日期或审核说明");
        if (r.status === "adopted") assert(text(r.adoptionPolicyId) && text(r.reviewNote) && r.reviewedBy === null && r.reviewedAt === null, r.id + " 缺少项目级采用策略或错误伪造逐条审核记录");
      }
    }
  }
  const indexes = Object.fromEntries(
    groups.map((g) => [g, new Map(bundle[g].map((r) => [r.id, r]))]),
  );
  const refs = (ids, target, owner, required = false) => {
    assert(
      strings(ids) && (!required || ids.length > 0),
      owner.id + " 的 " + target + " 引用列表无效",
    );
    for (const id of ids) {
      const dependency = indexes[target].get(id);
      assert(dependency, owner.id + " 引用了不存在的 " + target + ": " + id);
      if (release || owner.status === "approved" || owner.status === "adopted")
        assert(
          ["approved", "adopted"].includes(dependency.status) && !dependency.isMock,
          owner.id + " 引用了未审核依赖：" + id,
        );
    }
  };
  for (const s of bundle.sources) {
    assert(
      text(s.title) &&
        text(s.creator) &&
        text(s.locator) &&
        sourceTypes.includes(s.sourceType),
      s.id + " 来源字段不完整",
    );
    assert(
      s.url === null || (text(s.url) && safeUrl(s.url)),
      s.id + " 原始链接须为 http(s) 或 null",
    );
    if (release || s.status === "approved" || s.status === "adopted") {
      assert(s.sourceType !== "placeholder", s.id + " 占位来源禁止发布");
      if (s.sourceType === "official-web")
        assert(safeUrl(s.url), s.id + " 网络来源缺少原始链接");
    }
  }
  for (const p of bundle.places) {
    assert(
      text(p.name) &&
        p.schematic &&
        Number.isFinite(p.schematic.x) &&
        Number.isFinite(p.schematic.y) &&
        p.schematic.x >= 0 &&
        p.schematic.x <= 720 &&
        p.schematic.y >= 0 &&
        p.schematic.y <= 470,
      p.id + " 示意布局坐标无效",
    );
    assert(
      p.geography === null ||
        (Number.isFinite(p.geography?.latitude) &&
          Math.abs(p.geography.latitude) <= 90 &&
          Number.isFinite(p.geography?.longitude) &&
          Math.abs(p.geography.longitude) <= 180 &&
          text(p.geography?.sourceId)),
      p.id + " 地理字段无效",
    );
    if (p.geography) refs([p.geography.sourceId], "sources", p, true);
    if (p.sourceIds !== undefined) refs(p.sourceIds, "sources", p, true);
    if (p.periodLayouts !== undefined) for (const [periodId, point] of Object.entries(p.periodLayouts)) {
      assert(PERIOD_IDS.includes(periodId) && point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 720 && point.y >= 0 && point.y <= 470, p.id + " 章节示意位置无效");
    }
  }
  for (const e of bundle.events) {
    assert(
      PERIOD_IDS.includes(e.periodId) && text(e.title),
      e.id + " 章节或名称无效",
    );
    assert(
      e.date &&
        text(e.date.label) &&
        (e.date.start === null || date(e.date.start)) &&
        (e.date.end === null || date(e.date.end)),
      e.id + " 日期字段无效",
    );
    if (e.date.start && e.date.end)
      assert(e.date.start <= e.date.end, e.id + " 时间顺序反转");
    assert(
      strings(e.participants) &&
        text(e.factSummary) &&
        typeof e.historicalSignificance === "string" &&
        typeof e.learningReflection === "string",
      e.id + " 事件正文或人物列表无效",
    );
    // A historical topic may have no defensible single location. Its chapter
    // directory remains its entry point; every supplied place reference is
    // still validated, and source/review requirements remain unchanged.
    refs(e.placeIds, "places", e);
    refs(e.sourceIds, "sources", e, release || e.status === "approved" || e.status === "adopted");
    for (const field of ["people", "supplements"]) if (e[field] !== undefined) {
      assert(Array.isArray(e[field]), e.id + " " + field + " 必须为数组");
      const seen = new Set();
      for (const item of e[field]) {
        const key = field === "people" ? item?.name : item?.title;
        assert(text(key) && !seen.has(key) && text(field === "people" ? item.role : item.text), e.id + " 人物或补充史料字段无效");
        seen.add(key); refs(item.sourceIds, "sources", e, true);
        assert(item.sourceIds.every(id => e.sourceIds.includes(id)), e.id + " 补充依据未列入事件来源");
      }
    }
    assert(Array.isArray(e.media), e.id + " media 必须为数组");
    const mediaIds = new Set();
    for (const m of e.media) {
      assert(
        m &&
          text(m.id) &&
          !mediaIds.has(m.id) &&
          ["image", "audio"].includes(m.type) &&
          text(m.path) &&
          !m.path.startsWith("/") &&
          !m.path.includes("..") &&
          !m.path.includes(":") &&
          !m.path.includes("\\") &&
          text(m.alt) &&
          text(m.rights),
        e.id + " 素材字段或使用授权无效",
      );
      mediaIds.add(m.id);
      refs([m.sourceId], "sources", e, true);
      assert(
        e.sourceIds.includes(m.sourceId),
        e.id + " 素材来源须列入 sourceIds",
      );
    }
  }
  for (const r of bundle.relations) {
    assert(
      ["relocation", "organization-link"].includes(r.kind) &&
        PERIOD_IDS.includes(r.periodId),
      r.id + " 关系类型或章节无效",
    );
    assert(r.fromPlaceId !== r.toPlaceId, r.id + " 关系端点不能相同");
    refs([r.fromPlaceId, r.toPlaceId], "places", r, true);
    refs(r.eventIds, "events", r, release || r.status === "approved" || r.status === "adopted");
    refs(r.sourceIds, "sources", r, release || r.status === "approved" || r.status === "adopted");
    assert(
      r.kind === "relocation"
        ? Number.isInteger(r.sequence) && r.sequence >= 0
        : r.sequence === null,
      r.id + " 迁校顺序与组织联系字段混用",
    );
    for (const id of r.eventIds)
      assert(
        indexes.events.get(id).periodId === r.periodId,
        r.id + " 关联事件章节不一致",
      );
  }
  return bundle;
}
export function readBundle(directory, options) {
  const bundle = Object.fromEntries(
    groups.map((name) => {
      const raw = readFileSync(join(directory, name + ".json"), "utf8").replace(
        /^\uFEFF/,
        "",
      );
      return [name, JSON.parse(raw)];
    }),
  );
  return validateBundle(bundle, options);
}
