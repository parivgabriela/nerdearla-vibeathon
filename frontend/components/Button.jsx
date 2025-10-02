export default function Button({ as: Tag = "button", className = "", variant = "primary", children, ...props }) {
  const base = "inline-flex items-center justify-center rounded-md px-3.5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-accent text-white hover:opacity-90 focus:ring-accent/50",
    secondary: "bg-white/10 text-text hover:bg-white/15 focus:ring-white/30",
    danger: "bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/40",
    ghost: "bg-transparent hover:bg-white/10 text-text focus:ring-white/20",
  };
  const cls = `${base} ${variants[variant] || variants.primary} ${className}`;
  return <Tag className={cls} {...props}>{children}</Tag>;
}
