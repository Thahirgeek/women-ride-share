import { ButtonHTMLAttributes, ReactNode } from "react";
import { BarsSpinner } from "@/components/ui/bars-spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
  isLoading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  fullWidth = false,
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-[inter-semibold] shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary)/35";

  const variants = {
    primary:
      "bg-(--primary) text-white hover:bg-(--primary-hover)",
    secondary:
      "border border-(--border) bg-white text-foreground hover:border-(--primary)/30 hover:bg-(--primary-soft)/30",
    danger: "bg-[var(--danger)] text-white hover:bg-[#c73131]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className} hover:cursor-pointer`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <BarsSpinner size={16} className="shrink-0" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
