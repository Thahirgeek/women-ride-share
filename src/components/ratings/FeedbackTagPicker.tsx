"use client";

import { FEEDBACK_TAG_OPTIONS, type FeedbackTag } from "@/lib/feedback";
import { cn } from "@/lib/utils";

interface FeedbackTagPickerProps {
  selected: FeedbackTag[];
  onChange: (next: FeedbackTag[]) => void;
}

export default function FeedbackTagPicker({ selected, onChange }: FeedbackTagPickerProps) {
  const selectedSet = new Set(selected);

  return (
    <div className="flex flex-wrap gap-2">
      {FEEDBACK_TAG_OPTIONS.map((tag) => {
        const isActive = selectedSet.has(tag);

        return (
          <button
            key={tag}
            type="button"
            onClick={() => {
              if (isActive) {
                onChange(selected.filter((item) => item !== tag));
                return;
              }

              onChange([...selected, tag]);
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-[inter-medium] transition-colors",
              isActive
                ? "border-(--primary) bg-(--primary-soft) text-(--primary)"
                : "border-(--border) bg-white text-(--text-2) hover:border-(--primary)/50"
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
