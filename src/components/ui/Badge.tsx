interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "purple"
    | "blue"
    | "gray";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-(--primary-soft) text-(--primary) border border-(--primary)/12",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-(--danger-soft) text-(--danger) border border-(--danger)/20",
  purple: "bg-(--primary-soft) text-(--primary) border border-(--primary)/12",
  blue: "bg-sky-50 text-sky-700 border border-sky-200",
  gray: "bg-slate-100 text-slate-700 border border-slate-200",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
