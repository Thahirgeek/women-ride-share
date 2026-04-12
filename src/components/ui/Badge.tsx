interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "pending"
    | "info"
    | "completed"
    | "purple"
    | "blue"
    | "gray";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-(--primary-soft) text-(--primary) border border-(--primary)/12",
  success: "bg-(--success-soft) text-(--success) border border-(--success)/22",
  warning: "bg-(--warning-soft) text-(--warning) border border-(--warning)/22",
  danger: "bg-(--danger-soft) text-(--danger) border border-(--danger)/20",
  pending: "bg-(--warning-soft) text-(--warning) border border-(--warning)/22",
  info: "bg-(--info-soft) text-(--info) border border-(--info)/22",
  completed: "bg-(--success-soft) text-(--success) border border-(--success)/22",
  purple: "bg-(--primary-soft) text-(--primary) border border-(--primary)/12",
  blue: "bg-(--info-soft) text-(--info) border border-(--info)/22",
  gray: "bg-(--bg-muted) text-(--text-2) border border-(--border)",
};

export default function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-[inter-semibold] ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
