"use client";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (next: number) => void;
  size?: "sm" | "md";
  readOnly?: boolean;
  className?: string;
}

const STAR_BUTTON_SIZE: Record<NonNullable<StarRatingProps["size"]>, string> = {
  sm: "text-lg",
  md: "text-2xl",
};

export default function StarRating({
  value,
  onChange,
  size = "md",
  readOnly = false,
  className,
}: StarRatingProps) {
  const normalized = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= normalized;

        return (
          <button
            key={star}
            type="button"
            disabled={readOnly || !onChange}
            onClick={() => onChange?.(star)}
            aria-label={`Rate ${star} out of 5`}
            className={cn(
              STAR_BUTTON_SIZE[size],
              "leading-none transition-colors",
              active ? "text-amber-400" : "text-gray-300",
              !readOnly && onChange ? "hover:text-amber-300" : "cursor-default"
            )}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
