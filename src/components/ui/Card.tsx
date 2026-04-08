import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "standard" | "neu";
}

export default function Card({
  children,
  className = "",
  variant = "standard",
}: CardProps) {
  const cardClass =
    variant === "neu"
      ? "rounded-lg border border-(--border) bg-(--bg-muted) p-5 shadow-[0_8px_20px_rgba(20,27,52,0.05)]"
      : "rounded-lg border border-(--border) bg-[var(--surface)] p-5 shadow-[0_10px_30px_rgba(20,27,52,0.06)]";

  return (
    <div className={`${cardClass} ${className}`} data-variant={variant}>
      {children}
    </div>
  );
}
