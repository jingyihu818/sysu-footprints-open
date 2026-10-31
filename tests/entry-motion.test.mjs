import test from "node:test";
import assert from "node:assert/strict";
import {
  createEntryKeyframes,
  createEntryOpacityKeyframes,
  entryDuration,
  ENTRY_EASING,
} from "../src/motion/entryMotion.ts";

test("入口镜头仅使用单段连续落位关键帧", () => {
  const frames = createEntryKeyframes({ fromX: 120, fromY: -300, scaleX: 0.5, scaleY: 0.4 });
  assert.equal(frames.length, 2);
  assert.equal(frames[0].offset, 0);
  assert.equal(frames[1].offset, 1);
  assert.equal(frames[1].transform, "none");
  assert.equal(frames[0].transform, "translate(120px,-300px) scale(0.5,0.4) rotate(-5deg)");
  assert.ok(frames.every((frame) => frame.opacity === undefined), "位移与透明度必须独立计时");
});

test("仅主入口增加25%时长，桌面与手机保留各自节奏", () => {
  assert.equal(entryDuration(false), 1275);
  assert.equal(entryDuration(true), 925);
  for (const [mobile, original] of [[false, 1020], [true, 740]]) {
    const ratio = entryDuration(mobile) / original;
    assert.ok(ratio >= 1.15 && ratio <= 1.25);
  }
});

test("推进曲线起止速度均为零，控制点保证单调且无回弹", () => {
  const [x1, y1, x2, y2] = ENTRY_EASING.match(/[\d.]+/g).map(Number);
  assert.ok(x1 > 0 && x2 < 1 && x1 < 1 && x2 > 0);
  assert.equal(y1, 0);
  assert.equal(y2, 1);
  assert.equal(y1 / x1, 0);
  assert.equal((1 - y2) / (1 - x2), 0);
});

test("图纸保持前70%不透明，接近落位后与实地图连续交接且精确结束", () => {
  const sheet = createEntryOpacityKeyframes();
  const map = createEntryOpacityKeyframes(true);
  assert.deepEqual(sheet.map((f) => f.offset), [0, 0.7, 1]);
  assert.deepEqual(map.map((f) => f.offset), [0, 0.7, 1]);
  assert.deepEqual(sheet.map((f) => f.opacity), [1, 1, 0]);
  assert.deepEqual(map.map((f) => f.opacity), [0.2, 0.2, 1]);
  assert.equal(sheet[1].easing, "cubic-bezier(.42,0,.58,1)");
  assert.equal(sheet[1].easing, map[1].easing);
});
