import Button from "./Button";

export default function EmptyState({ title, description, actionLabel, onAction, className = "" }) {
  return (
    <div className={`text-center py-12 px-6 rounded-xl bg-[var(--card)] shadow-card ${className}`}>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-[var(--muted)] mb-4">{description}</p>}
      {actionLabel && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
