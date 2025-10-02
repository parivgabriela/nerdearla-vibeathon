import Button from "./Button";

export default function ConfirmModal({ open, title = "¿Confirmar?", description, confirmText = "Confirmar", cancelText = "Cancelar", onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-[var(--card)] p-6 shadow-card">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        {description && <p className="text-[var(--muted)] mb-6">{description}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>{cancelText}</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </div>
    </div>
  );
}
