export default function Card({ className = "", children }) {
  return (
    <div className={`rounded-xl bg-[var(--card)] shadow-card p-5 ${className}`}>
      {children}
    </div>
  );
}
