export function Arrow({
  direction = "right",
}: {
  direction?: "right" | "left" | "down";
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        transform:
          direction === "left"
            ? "rotate(180deg)"
            : direction === "down"
              ? "rotate(90deg)"
              : undefined,
      }}
    >
      <path d="M4 12h15M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
export function SourceIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 3h11l3 3v15H5zM9 9h6M9 13h6M9 17h4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}
