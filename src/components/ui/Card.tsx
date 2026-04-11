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
      : "bg-[#efefed]/40 rounded-lg border-2 border-white shadow-[0_-3px_6px_rgba(255,255,255,1),0_-1px_0px_rgba(255,255,255,1),0_8px_16px_rgba(0,0,0,0.15),0_3px_6px_rgba(0,0,0,0.08),1px_0_2px_rgba(0,0,0,0.03),-1px_0_2px_rgba(0,0,0,0.03)] p-5";

  return (
    <div className={`${cardClass} ${className}`} data-variant={variant}>
      {children}
    </div>
  );
}
