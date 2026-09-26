import "./Skeleton.css";

// A shimmering placeholder block shown while data loads.
export function Skeleton({ width = "100%", height = "1rem", radius }) {
  return (
    <span
      className="skeleton"
      style={{ width, height, borderRadius: radius }}
      aria-hidden="true"
    />
  );
}

// A card-shaped placeholder (title line + two text lines).
export function SkeletonCard() {
  return (
    <div className="skeleton-card card" aria-hidden="true">
      <Skeleton width="55%" height="1.1rem" />
      <Skeleton width="90%" />
      <Skeleton width="70%" />
    </div>
  );
}

// `count` stacked card placeholders with an accessible loading label.
export function SkeletonList({ count = 3, label = "Loading..." }) {
  return (
    <div className="skeleton-list" role="status">
      <span className="skeleton-sr">{label}</span>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
