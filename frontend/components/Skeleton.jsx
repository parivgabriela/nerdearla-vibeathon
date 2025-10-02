export default function Skeleton({ className = "h-4 w-full" }) {
  return <div className={`animate-pulse rounded-md bg-white/10 ${className}`} />;
}
