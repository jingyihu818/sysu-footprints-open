import type { RecommendedRouteStep } from "../history/recommendedRoute";

export default function RecommendedRoute({
  steps,
  open,
  onToggle,
  onStep,
}: {
  steps: RecommendedRouteStep[];
  open: boolean;
  onToggle: () => void;
  onStep: (step: RecommendedRouteStep) => void;
}) {
  return (
    <aside className={"recommended-route " + (open ? "is-open" : "")} aria-labelledby="recommended-route-title">
      <div className="recommended-route-header">
        <div>
          <p className="eyebrow">建议路径 / 约三分钟</p>
          <h3 id="recommended-route-title">先看这七步，再自由探索。</h3>
        </div>
        <button type="button" className="text-button" onClick={onToggle} aria-expanded={open}>
          {open ? "收起路线" : "展开路线"}
        </button>
      </div>
      {open && <ol className="recommended-route-list">
        {steps.map((step, index) => <li key={step.id}>
          <button type="button" disabled={!step.available} onClick={() => onStep(step)} aria-label={`${index + 1}. ${step.label}${step.available ? "" : "（当前模式暂无可用内容）"}`}>
            <span className="recommended-route-index">{String(index + 1).padStart(2, "0")}</span>
            <span className="recommended-route-copy"><strong>{step.label}</strong><small>{step.description}</small></span>
            <span className="recommended-route-status">{step.available ? "进入" : "待内容"}</span>
          </button>
        </li>)}
      </ol>}
      <p className="recommended-route-note">路线只提供入口，不锁定顺序；任何一步都可以退出并继续查看其他章节。</p>
    </aside>
  );
}
