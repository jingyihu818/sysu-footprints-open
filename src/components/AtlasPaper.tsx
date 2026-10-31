import { useId, type CSSProperties } from "react";
import "./atlas-connections.css";
export default function AtlasPaper({
  year,
  points = [],
  decorativeConnections = false,
}: {
  year?: string;
  points?: { x: number; y: number }[];
  decorativeConnections?: boolean;
}) {
  const id = useId().replaceAll(":", "");
  return (
    <svg
      className="atlas-paper"
      viewBox="0 0 720 470"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={"atlas-grid-" + id}
          width="36"
          height="36"
          patternUnits="userSpaceOnUse"
        >
          <path d="M36 0H0V36" stroke="currentColor" strokeOpacity=".11" />
        </pattern>
        <linearGradient
          id={"atlas-glow-" + id}
          x1="0"
          y1="0"
          x2="720"
          y2="470"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff9e6" stopOpacity=".75" />
          <stop offset="1" stopColor="#c9c0a9" stopOpacity=".06" />
        </linearGradient>
      </defs>
      <rect width="720" height="470" fill={"url(#atlas-glow-" + id + ")"} />
      <rect width="720" height="470" fill={"url(#atlas-grid-" + id + ")"} />
      <g className="atlas-contours" stroke="currentColor" strokeOpacity=".17">
        <path d="M-50 370C120 240 70 105 245 90S465 300 720 175M-40 405C120 260 150 165 270 140S490 350 755 215M-10 435C185 315 200 210 310 190S540 390 760 270M-20 330C80 180 140 60 290 55S500 240 760 125" />
        <path d="M-20 470C200 365 270 285 355 255S550 440 770 330" />
      </g>
      {/* Existing abstract contour, never a historical route or connection. */}
      <g className="atlas-gilded-trace" stroke="#b58a48" strokeWidth="1.1" opacity="0">
        <path d="M-50 370C120 240 70 105 245 90S465 300 720 175" />
      </g>
      {decorativeConnections && <g className="atlas-thread-weave" aria-hidden="true">
        {[
          "M82 286C129 255 138 161 219 155S317 232 360 235 453 287 514 324 601 318 650 364",
          "M82 286C147 335 203 382 279 368S387 294 360 235 411 128 477 88 591 94 648 142",
          "M219 155C228 108 278 71 327 78S423 133 477 88",
          "M279 368C357 406 451 393 514 324S576 220 648 142",
        ].map((path, index) => <g key={path} style={{"--thread-delay": `${index * 1.3}s`} as CSSProperties}>
          <path className="atlas-thread-base" d={path} />
          <path className={"atlas-thread-line " + (index === 0 ? "atlas-thread-line-main" : "atlas-thread-line-branch")} pathLength="1" d={path} />
          <path className="atlas-thread-current" pathLength="1" d={path} />
        </g>)}
        {[[82,286],[219,155],[327,78],[360,235],[477,88],[648,142],[514,324],[650,364],[279,368]].map(([x,y], index) => <g key={index} style={{"--thread-delay": `${index * .8}s`} as CSSProperties}>
          <circle className="atlas-thread-halo" cx={x} cy={y} r="13" />
          <circle className={"atlas-thread-knot knot-" + index} cx={x} cy={y} r="4" />
          <path className="atlas-thread-tick" d={`M${x-19} ${y}h7M${x+12} ${y}h7`} />
        </g>)}
        <g className="atlas-thread-margins" fill="currentColor" stroke="none" fontFamily="Georgia,serif" fontSize="11" letterSpacing="2">
          <text x="74" y="321">01</text><text x="226" y="137">02</text><text x="487" y="74">03</text><text x="526" y="352">04</text><text x="610" y="398">05</text>
        </g>
      </g>}
      <path
        d="M24 24h30M24 24v30M696 24h-30M696 24v30M24 446h30M24 446v-30M696 446h-30M696 446v-30"
        stroke="currentColor"
        strokeOpacity=".45"
      />
      <g
        className="atlas-registration"
        stroke="currentColor"
        strokeOpacity=".23"
      >
        <path d="M340 235h40M360 215v40" />
        <circle cx="360" cy="235" r="44" />
        <circle cx="360" cy="235" r="70" strokeDasharray="2 10" />
      </g>
      {year && (
        <text
          className="atlas-year"
          x="48"
          y="117"
          fill="currentColor"
          fillOpacity=".085"
          fontSize="80"
          fontFamily="Georgia,serif"
        >
          {year}
        </text>
      )}
      {points.map((point, i) => (
        <g className="atlas-ghost-point" key={i}>
          <circle
            cx={point.x}
            cy={point.y}
            r="22"
            stroke="#954638"
            strokeOpacity=".4"
          />
          <circle cx={point.x} cy={point.y} r="6" fill="#954638" />
          <path
            d={
              "M" +
              (point.x - 36) +
              " " +
              point.y +
              "h12M" +
              (point.x + 24) +
              " " +
              point.y +
              "h12"
            }
            stroke="#954638"
            strokeOpacity=".6"
          />
        </g>
      ))}
      <text
        x="38"
        y="429"
        fill="currentColor"
        fillOpacity=".75"
        fontSize="10"
        letterSpacing="2"
      >
        SCHEMATIC / 非地理底图
      </text>
    </svg>
  );
}
