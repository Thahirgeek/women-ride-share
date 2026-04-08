import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = "",
  id,
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-(--text-2)"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`rounded-lg border border-(--border) bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-(--text-3) outline-none transition-all duration-200 focus:border-(--primary)/55 focus:ring-2 focus:ring-(--primary)/15 disabled:bg-(--bg-muted) disabled:text-(--text-3) ${error ? "border-(--danger)/45 focus:border-(--danger) focus:ring-(--danger)/20" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-(--danger)">{error}</p>}
    </div>
  );
}
