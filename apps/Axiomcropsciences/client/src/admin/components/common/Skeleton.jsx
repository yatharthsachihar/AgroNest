export default function Skeleton({ width = '100%', height = 20, radius = 8, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
