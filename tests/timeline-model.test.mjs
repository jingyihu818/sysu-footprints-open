import test from "node:test";
import assert from "node:assert/strict";
import { clampPeriodIndex, getPeriodRangeValue } from "../src/components/timelineModel.ts";
import { readingParagraphs } from "../src/history/paragraphs.ts";

test("历史阅读仅在显示层恢复转义换行，兼容实际换行和原有标点", () => {
  const original = '第一段。\\n\\n第二段。\n\n第三段。';
  assert.deepEqual(readingParagraphs(original), ['第一段。', '第二段。', '第三段。']);
  assert.equal(original, '第一段。\\n\\n第二段。\n\n第三段。');
  assert.deepEqual(readingParagraphs('保留\\其他文字。'), ['保留\\其他文字。']);
});

test("range游标吸附到最近的离散时期并限制边界", () => {
  assert.equal(clampPeriodIndex(1.7, 5), 2);
  assert.equal(clampPeriodIndex(-2, 5), 0);
  assert.equal(clampPeriodIndex(8, 5), 4);
});

test("range索引对应章节顺序，不以年份差值伪造间隔", () => {
  const ids = ["p1924", "p1927", "p1938", "p1947", "p2026"];
  assert.deepEqual(ids.map((id) => getPeriodRangeValue(id, ids)), [0, 1, 2, 3, 4]);
});
