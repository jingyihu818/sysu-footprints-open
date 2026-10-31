import { test } from "node:test";
import assert from "node:assert/strict";
import { MotionDirector } from "../src/motion/director.ts";
function actor() {
  const animations = [];
  return {
    animations,
    element: {
      animate() {
        let resolve, reject;
        const finished = new Promise((a, b) => {
          resolve = a;
          reject = b;
        });
        const a = {
          finished,
          finish: resolve,
          cancel() {
            a.cancelled = true;
            reject(new Error("cancelled"));
          },
          cancelled: false,
        };
        animations.push(a);
        return a;
      },
    },
  };
}
const spec = (element) => [
  { element, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
];
test("运动完成清理fill和实例，但不改变业务状态", async () => {
  const d = new MotionDirector(),
    a = actor(),
    domain = { period: "p1924" };
  const p = d.play("period", spec(a.element));
  assert.equal(d.activeCount, 1);
  a.animations[0].finish();
  assert.equal(await p, "completed");
  assert.equal(d.activeCount, 0);
  assert.equal(a.animations[0].cancelled, true);
  assert.deepEqual(domain, { period: "p1924" });
});
test("快速接管取消旧镜头，旧完成不会释放新组", async () => {
  const d = new MotionDirector(),
    a = actor(),
    b = actor(),
    released = [];
  const old = d.play("period", spec(a.element), (r) =>
    released.push("old:" + r),
  );
  const next = d.play("period", spec(b.element), (r) =>
    released.push("new:" + r),
  );
  assert.equal(await old, "cancelled");
  a.animations[0].finish();
  await Promise.resolve();
  assert.equal(d.activeCount, 1);
  b.animations[0].finish();
  assert.equal(await next, "completed");
  assert.deepEqual(released, ["old:cancelled", "new:completed"]);
});
test("入口和年代通道可分别取消", async () => {
  const d = new MotionDirector(),
    a = actor(),
    b = actor();
  const entry = d.play("entry", spec(a.element)),
    period = d.play("period", spec(b.element));
  d.cancel("entry");
  assert.equal(await entry, "cancelled");
  assert.equal(d.activeCount, 1);
  b.animations[0].finish();
  assert.equal(await period, "completed");
});
test("跳过立即完成清理且不等待任何finished", async () => {
  const d = new MotionDirector(),
    a = actor(),
    b = actor();
  const p = d.play("entry", spec(a.element)),
    q = d.play("period", spec(b.element));
  d.cancelAll("skipped");
  assert.equal(d.activeCount, 0);
  assert.deepEqual(await Promise.all([p, q]), ["skipped", "skipped"]);
});
test("减少动态模式直接展示静态结果", async () => {
  const d = new MotionDirector(),
    a = actor();
  d.enabled = false;
  assert.equal(await d.play("entry", spec(a.element)), "skipped");
  assert.equal(a.animations.length, 0);
});
test("不支持animate时可靠降级", async () => {
  const d = new MotionDirector();
  let released = 0;
  assert.equal(await d.play("entry", spec({}), () => released++), "skipped");
  assert.equal(released, 1);
  assert.equal(d.activeCount, 0);
});
test("动画引擎中途抛错不会遗留图纸或未处理拒绝", async () => {
  const d = new MotionDirector(),
    a = actor();
  let status;
  const p = d.play(
    "entry",
    [
      ...spec(a.element),
      ...spec({
        animate() {
          throw new Error("engine unavailable");
        },
      }),
    ],
    (r) => (status = r),
  );
  assert.equal(await p, "skipped");
  assert.equal(status, "skipped");
  assert.equal(a.animations[0].cancelled, true);
  assert.equal(d.activeCount, 0);
});
test("引擎自行取消也会释放对应视觉状态", async () => {
  const d = new MotionDirector(),
    a = actor();
  let releases = 0;
  const p = d.play("focus", spec(a.element), () => releases++);
  a.animations[0].cancel();
  assert.equal(await p, "cancelled");
  d.cancelAll();
  assert.equal(releases, 1);
  assert.equal(d.activeCount, 0);
});
