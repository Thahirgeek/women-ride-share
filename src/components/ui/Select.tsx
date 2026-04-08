import { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export default function Select({
  label,
  error,
  options,
  className = "",
  id,
  ...props
}: SelectProps) {
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
      <select
        id={id}
        className={`rounded-lg border border-(--border) bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus:border-(--primary)/55 focus:ring-2 focus:ring-(--primary)/15 disabled:bg-(--bg-muted) disabled:text-(--text-3) ${error ? "border-(--danger)/45 focus:border-(--danger) focus:ring-(--danger)/20" : ""} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-(--danger)">{error}</p>}
    </div>
  );
}
