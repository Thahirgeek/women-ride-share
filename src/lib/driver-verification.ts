export type DriverVerificationStatus =
  | "UNVERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REVOKED";

export type DriverVerificationAction =
  | "REQUEST_REVIEW"
  | "APPROVE"
  | "REVOKE";

const ACTION_ALIASES: Record<string, DriverVerificationAction> = {
  VERIFY: "APPROVE",
  REQUEST_REVIEW: "REQUEST_REVIEW",
  APPROVE: "APPROVE",
  REVOKE: "REVOKE",
};

const TRANSITIONS: Record<DriverVerificationStatus, DriverVerificationStatus[]> = {
  UNVERIFIED: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["VERIFIED", "REVOKED"],
  VERIFIED: ["REVOKED"],
  REVOKED: ["PENDING_REVIEW"],
};

const ACTION_TARGET: Record<DriverVerificationAction, DriverVerificationStatus> = {
  REQUEST_REVIEW: "PENDING_REVIEW",
  APPROVE: "VERIFIED",
  REVOKE: "REVOKED",
};

export function normalizeDriverVerificationAction(
  input: unknown
): DriverVerificationAction | null {
  if (typeof input !== "string") return null;

  return ACTION_ALIASES[input.toUpperCase()] ?? null;
}

export function getNextVerificationStatus(action: DriverVerificationAction) {
  return ACTION_TARGET[action];
}

export function canTransitionVerificationStatus(
  fromStatus: DriverVerificationStatus,
  action: DriverVerificationAction
) {
  const toStatus = getNextVerificationStatus(action);
  return TRANSITIONS[fromStatus].includes(toStatus);
}

export function isDriverVerifiedStatus(status: DriverVerificationStatus) {
  return status === "VERIFIED";
}

export function getDriverNotVerifiedMessage(status: DriverVerificationStatus) {
  switch (status) {
    case "UNVERIFIED":
      return "Complete onboarding and submit your documents for review before publishing rides.";
    case "PENDING_REVIEW":
      return "Your profile is under review. An admin must approve your account before you can publish rides.";
    case "REVOKED":
      return "Your driver access is currently revoked. Contact support or request review from admin.";
    default:
      return "Driver verification required before publishing rides.";
  }
}
