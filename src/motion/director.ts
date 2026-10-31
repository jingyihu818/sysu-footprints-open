export type MotionResult = "completed" | "cancelled" | "skipped";
export interface MotionSpec {
  element: Element;
  keyframes: Keyframe[] | PropertyIndexedKeyframes;
  options?: KeyframeAnimationOptions;
}
interface MotionRun {
  animations: Animation[];
  release: (result: MotionResult) => void;
}
/** 只控制视觉实例；绝不延迟或提交时期/地点/事件状态。 */
export class MotionDirector {
  enabled = true;
  private groups = new Map<string, MotionRun>();
  get activeCount() {
    return this.groups.size;
  }
  play(
    group: string,
    specs: MotionSpec[],
    onRelease?: (result: MotionResult) => void,
  ): Promise<MotionResult> {
    this.cancel(group);
    if (
      !this.enabled ||
      !specs.length ||
      specs.some((spec) => typeof spec.element.animate !== "function")
    ) {
      onRelease?.("skipped");
      return Promise.resolve("skipped");
    }
    let resolve!: (result: MotionResult) => void;
    const result = new Promise<MotionResult>((done) => {
      resolve = done;
    });
    let settled = false;
    const run: MotionRun = {
      animations: [],
      release: (status) => {
        if (settled) return;
        settled = true;
        if (this.groups.get(group) === run) this.groups.delete(group);
        for (const animation of run.animations) animation.cancel();
        onRelease?.(status);
        resolve(status);
      },
    };
    this.groups.set(group, run);
    try {
      for (const spec of specs) {
        const animation = spec.element.animate(spec.keyframes, {
          duration: 420,
          easing: "cubic-bezier(.16,1,.3,1)",
          fill: "both",
          ...spec.options,
        });
        // cancel() 会拒绝 finished；在任何取消发生之前立即安装拒绝处理。
        animation.finished.catch(() => undefined);
        run.animations.push(animation);
      }
      void Promise.allSettled(run.animations.map((a) => a.finished)).then(
        (results) => {
          if (this.groups.get(group) !== run) return;
          run.release(
            results.every((r) => r.status === "fulfilled")
              ? "completed"
              : "cancelled",
          );
        },
      );
    } catch {
      run.release("skipped");
    }
    return result;
  }
  cancel(group: string, reason: MotionResult = "cancelled") {
    this.groups.get(group)?.release(reason);
  }
  cancelAll(reason: MotionResult = "cancelled") {
    for (const run of [...this.groups.values()]) run.release(reason);
  }
}
