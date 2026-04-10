import { LocationSuggestion } from "@/lib/location-types";

export function normalizeLocationLabel(label: string) {
  return label.trim().replace(/\s+/g, " ");
}

export function isLocationSuggestion(value: unknown): value is LocationSuggestion {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<LocationSuggestion>;

  return (
    typeof candidate.placeId === "string" &&
    candidate.placeId.trim().length > 0 &&
    typeof candidate.label === "string" &&
    candidate.label.trim().length > 0 &&
    typeof candidate.lat === "number" &&
    Number.isFinite(candidate.lat) &&
    typeof candidate.lng === "number" &&
    Number.isFinite(candidate.lng)
  );
}
