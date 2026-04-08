"use client";

interface SafetyFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const options = [
  {
    value: "NONE",
    label: "No Preference",
    description: "Show all available rides",
  },
  {
    value: "LADIES_ONLY",
    label: "Ladies Only",
    description: "Driver has lady passengers onboard",
    emoji: "👩",
  },
  {
    value: "FAMILY_PREFERRED",
    label: "Family Preferred",
    description: "Driver has family or kids onboard",
    emoji: "👨‍👩‍👧",
  },
];

export default function SafetyFilter({ value, onChange }: SafetyFilterProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-gray-700">
        Safety Filter
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-all duration-200 ${
              value === opt.value
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name="safetyFilter"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {opt.emoji && `${opt.emoji} `}
                {opt.label}
              </span>
              <span className="text-xs text-gray-500">{opt.description}</span>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
