export const FEEDBACK_TAG_OPTIONS = [
  "Safe driving",
  "On time",
  "Polite",
  "Clean vehicle",
  "Helpful",
  "Good communication",
] as const;

export type FeedbackTag = (typeof FEEDBACK_TAG_OPTIONS)[number];

const FEEDBACK_TAG_SET = new Set<string>(FEEDBACK_TAG_OPTIONS);

export const FEEDBACK_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;
export const FEEDBACK_MAX_COMMENT_LENGTH = 500;

export function normalizeScore(input: unknown) {
  const score = Number(input);

  if (!Number.isInteger(score) || score < 1 || score > 5) {
    return null;
  }

  return score;
}

export function normalizeComment(input: unknown) {
  if (typeof input !== "string") return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  return trimmed.slice(0, FEEDBACK_MAX_COMMENT_LENGTH);
}

export function normalizeTags(input: unknown): FeedbackTag[] {
  if (!Array.isArray(input)) return [];

  const deduped = [...new Set(input.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()))];

  return deduped.filter((tag): tag is FeedbackTag => FEEDBACK_TAG_SET.has(tag));
}

export function canEditFeedback(createdAt: Date) {
  return Date.now() - createdAt.getTime() <= FEEDBACK_EDIT_WINDOW_MS;
}

export function getEditDeadline(createdAt: Date) {
  return new Date(createdAt.getTime() + FEEDBACK_EDIT_WINDOW_MS);
}
