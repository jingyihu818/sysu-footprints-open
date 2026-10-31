import { forwardRef } from "react";
import AtlasPaper from "./AtlasPaper";
import MeteorField from "./MeteorField";
const ContinuityAtlas = forwardRef<
  HTMLDivElement,
  { year: string; points: { x: number; y: number }[] }
>(function ContinuityAtlas({ year, points }, ref) {
  return (
    <div ref={ref} className="continuity-atlas" aria-hidden="true" hidden>
      <div className="continuity-veil"><MeteorField scene="entry" /></div>
      <div className="continuity-sheet">
        <AtlasPaper year={year} points={points} />
        <span className="continuity-edge" />
        <span className="gilded-light gilded-edge" aria-hidden="true" />
      </div>
    </div>
  );
});
export default ContinuityAtlas;
