"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { WaveLoader } from "@/components/wave-loader";
import BasicModal from "@/components/modal";

type Tab = "users" | "rides" | "drivers";
type VerificationStatus =
  | "UNVERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REVOKED";
type VerificationAction = "REQUEST_REVIEW" | "APPROVE" | "REVOKE";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  gender: string;
  createdAt: string;
}

interface Ride {
  id: string;
  source: string;
  destination: string;
  status: string;
  createdAt: string;
  driver: { user: { name: string } };
}

interface Driver {
  id: string;
  licenseNumber: string;
  isAvailable: boolean;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationReason?: string | null;
  pendingDocumentCount?: number;
  documents?: {
    id: string;
    documentType: "LICENSE" | "VEHICLE_REGISTRATION" | "INSURANCE" | "OTHER";
    storageUrl: string;
    originalFileName?: string | null;
    mimeType?: string | null;
    fileSizeBytes?: number | null;
    reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
    submittedAt: string;
    reviewedAt?: string | null;
    rejectionReason?: string | null;
  }[];
  user: { name: string; email: string };
  vehicle?: { vehicleType: string; model: string };
}

const VERIFICATION_META: Record<
  VerificationStatus,
  { label: string; variant: "default" | "warning" | "success" | "danger" }
> = {
  UNVERIFIED: { label: "Unverified", variant: "default" },
  PENDING_REVIEW: { label: "Pending Review", variant: "warning" },
  VERIFIED: { label: "Verified", variant: "success" },
  REVOKED: { label: "Revoked", variant: "danger" },
};

const ACTION_COPY: Record<
  VerificationAction,
  { title: string; confirm: string; message: (name: string) => string }
> = {
  REQUEST_REVIEW: {
    title: "Move Driver To Review",
    confirm: "Confirm Move To Review",
    message: (name) =>
      `Move ${name} to the review queue so they can be approved again?`,
  },
  APPROVE: {
    title: "Approve Driver",
    confirm: "Confirm Approval",
    message: (name) =>
      `Approve ${name}? They will be able to publish rides immediately.`,
  },
  REVOKE: {
    title: "Revoke Driver",
    confirm: "Confirm Revoke",
    message: (name) =>
      `Revoke ${name}? OPEN rides and future BOOKED rides will be cancelled.`,
  },
};

const REQUIRED_DOCUMENT_TYPES = [
  "LICENSE",
  "VEHICLE_REGISTRATION",
  "INSURANCE",
] as const;

const REQUIRED_DOCUMENT_LABELS: Record<
  (typeof REQUIRED_DOCUMENT_TYPES)[number],
  string
> = {
  LICENSE: "License",
  VEHICLE_REGISTRATION: "Vehicle Registration",
  INSURANCE: "Insurance",
};

type ApprovalWarningStatus = "MISSING" | "PENDING" | "REJECTED";

type DriverDocumentReviewStatus =
  NonNullable<Driver["documents"]>[number]["reviewStatus"];

function getApprovalWarnings(driver: Driver) {
  const latestStatusByType = new Map<string, DriverDocumentReviewStatus>();
  for (const document of driver.documents || []) {
    if (!latestStatusByType.has(document.documentType)) {
      latestStatusByType.set(document.documentType, document.reviewStatus);
    }
  }

  return REQUIRED_DOCUMENT_TYPES.filter(
    (documentType) => latestStatusByType.get(documentType) !== "APPROVED"
  ).map((documentType) => {
    const status = latestStatusByType.get(documentType);
    const warningStatus: ApprovalWarningStatus =
      status === "PENDING" || status === "REJECTED" ? status : "MISSING";

    return {
      documentType,
      status: warningStatus,
    };
  });
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyLoadingId, setVerifyLoadingId] = useState<string | null>(null);
  const [docReviewLoadingId, setDocReviewLoadingId] = useState<string | null>(
    null
  );
  const [pendingVerification, setPendingVerification] = useState<{
    driverId: string;
    driverName: string;
    action: VerificationAction;
    approvalWarnings: {
      documentType: (typeof REQUIRED_DOCUMENT_TYPES)[number];
      status: ApprovalWarningStatus;
    }[];
  } | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchDrivers = async () => {
    const r = await fetch("/api/admin/users?drivers=true");
    const d = await r.json();
    setDrivers(d.drivers || []);
  };

  useEffect(() => {
    setLoading(true);
    if (tab === "users") {
      fetch("/api/admin/users")
        .then((r) => r.json())
        .then((d) => { setUsers(d.users || []); setLoading(false); });
    } else if (tab === "rides") {
      fetch("/api/admin/rides")
        .then((r) => r.json())
        .then((d) => { setRides(d.rides || []); setLoading(false); });
    } else {
      fetchDrivers()
        .finally(() => setLoading(false));
    }
  }, [tab]);

  const updateVerification = async (
    driverId: string,
    action: VerificationAction,
    reason?: string
  ) => {
    const isApprove = action === "APPROVE";

    setActionMessage(null);
    setVerifyLoadingId(driverId);
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update verification status.");
      }

      await fetchDrivers();

      if (isApprove) {
        const warnings = Array.isArray(data.incompleteRequiredDocuments)
          ? data.incompleteRequiredDocuments.length
          : 0;

        setActionMessage({
          type: "success",
          text:
            warnings > 0
              ? `Driver approved with ${warnings} document warning${warnings === 1 ? "" : "s"}.`
              : "Driver approved successfully.",
        });
      } else if (action === "REQUEST_REVIEW") {
        setActionMessage({
          type: "success",
          text: "Driver moved to review queue.",
        });
      } else {
        const cancelledCount = data.cancelledOpenRides ?? 0;
        const cancelledFutureBooked = data.cancelledFutureBookedRides ?? 0;
        const totalCancelled = cancelledCount + cancelledFutureBooked;
        const plural = totalCancelled === 1 ? "ride" : "rides";
        setActionMessage({
          type: "success",
          text: `Driver revoked. ${totalCancelled} ${plural} cancelled (${cancelledCount} open, ${cancelledFutureBooked} future booked).`,
        });
      }
    } catch (error) {
      setActionMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Failed to update verification status.",
      });
    } finally {
      setVerifyLoadingId(null);
    }
  };

  const reviewDocument = async (
    driverId: string,
    documentId: string,
    reviewStatus: "APPROVED" | "REJECTED"
  ) => {
    const rejectionReason =
      reviewStatus === "REJECTED"
        ? window
            .prompt("Provide a rejection reason for the driver:", "")
            ?.trim() ?? ""
        : "";

    if (reviewStatus === "REJECTED" && !rejectionReason) {
      setActionMessage({
        type: "error",
        text: "Rejection reason is required to reject a document.",
      });
      return;
    }

    setDocReviewLoadingId(documentId);
    setActionMessage(null);
    try {
      const res = await fetch(
        `/api/admin/drivers/${driverId}/documents/${documentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewStatus, rejectionReason }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to review document.");
      }

      await fetchDrivers();
      setActionMessage({
        type: "success",
        text:
          reviewStatus === "APPROVED"
            ? "Document approved."
            : "Document rejected with feedback.",
      });
    } catch (error) {
      setActionMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to review document.",
      });
    } finally {
      setDocReviewLoadingId(null);
    }
  };

  const requestVerificationAction = (driver: Driver, action: VerificationAction) => {
    setActionReason("");
    setPendingVerification({
      driverId: driver.id,
      driverName: driver.user.name,
      action,
      approvalWarnings: action === "APPROVE" ? getApprovalWarnings(driver) : [],
    });
  };

  const closeVerificationModal = () => {
    if (verifyLoadingId) return;
    setPendingVerification(null);
    setActionReason("");
  };

  const confirmVerificationAction = async () => {
    if (!pendingVerification) return;

    await updateVerification(
      pendingVerification.driverId,
      pendingVerification.action,
      pendingVerification.action === "REVOKE" ? actionReason.trim() : undefined
    );
    setPendingVerification(null);
    setActionReason("");
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "users", label: "Users" },
    { key: "rides", label: "Rides" },
    { key: "drivers", label: "Drivers" },
  ];

  return (
    <>
      <BasicModal
        isOpen={!!pendingVerification}
        onClose={closeVerificationModal}
        title={pendingVerification ? ACTION_COPY[pendingVerification.action].title : ""}
        size="md"
      >
        <div className="space-y-5">
          <p className="text-sm text-(--text-2)">
            {pendingVerification
              ? ACTION_COPY[pendingVerification.action].message(
                  pendingVerification.driverName
                )
              : ""}
          </p>

          {pendingVerification?.action === "APPROVE" &&
            pendingVerification.approvalWarnings.length > 0 && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                <p className="font-medium">Document review warning</p>
                <p className="mt-1 text-xs">
                  Required documents are incomplete. You can still approve this driver.
                </p>
                <ul className="mt-2 list-disc pl-4 text-xs">
                  {pendingVerification.approvalWarnings.map((warning) => (
                    <li key={warning.documentType}>
                      {REQUIRED_DOCUMENT_LABELS[warning.documentType]}: {warning.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {pendingVerification?.action === "REVOKE" && (
            <div className="space-y-2">
              <label
                htmlFor="revokeReason"
                className="text-sm font-medium text-foreground"
              >
                Revoke reason
              </label>
              <textarea
                id="revokeReason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                placeholder="Explain why this driver is being revoked"
                className="w-full rounded-lg border border-border bg-(--surface) px-3 py-2 text-sm text-foreground"
              />
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={closeVerificationModal}
              disabled={!!verifyLoadingId}
            >
              Cancel
            </Button>
            <Button
              variant={
                pendingVerification?.action === "REVOKE" ? "danger" : "primary"
              }
              onClick={confirmVerificationAction}
              disabled={
                pendingVerification?.action === "REVOKE" && !actionReason.trim()
              }
              isLoading={
                pendingVerification
                  ? verifyLoadingId === pendingVerification.driverId
                  : false
              }
            >
              {pendingVerification
                ? ACTION_COPY[pendingVerification.action].confirm
                : "Confirm"}
            </Button>
          </div>
        </div>
      </BasicModal>

      <div className="mb-8">
        <h1 className="text-3xl font-[instrumentserif-regular] text-foreground sm:text-5xl lg:text-6xl">Admin Dashboard</h1>
        <p className="mt-1 text-(--text-2)">
          Manage users, rides, and drivers.
        </p>
      </div>

      {actionMessage && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            actionMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {actionMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex w-full gap-1 rounded-lg border border-black/15 bg-(--bg-muted) p-1 sm:w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 cursor-pointer rounded-sm px-4 py-2 text-sm font-medium transition-all sm:flex-none ${
              tab === t.key
                ? "bg-black/70 text-white shadow-sm"
                : "text-(--text-2) hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <WaveLoader />
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {tab === "users" && (
            <Card>
              <div className="space-y-3 md:hidden">
                {users.length === 0 ? (
                  <p className="py-6 text-center text-sm text-(--text-2)">No users found.</p>
                ) : (
                  users.map((u) => (
                    <div key={u.id} className="rounded-lg border border-border bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{u.name}</p>
                          <p className="text-xs text-(--text-2)">{u.email}</p>
                        </div>
                        <Badge>{u.role}</Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-(--text-2)">
                        <span>{u.gender}</span>
                        <span>-</span>
                        <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Name</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Email</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Role</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Gender</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-(--text-2)">
                          No users found.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="border-b border-border">
                          <td className="py-3 font-medium text-foreground">{u.name}</td>
                          <td className="py-3 text-(--text-2)">{u.email}</td>
                          <td className="py-3"><Badge>{u.role}</Badge></td>
                          <td className="py-3 text-(--text-2)">{u.gender}</td>
                          <td className="py-3 text-(--text-2)">{new Date(u.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Rides Tab */}
          {tab === "rides" && (
            <Card>
              <div className="space-y-3 md:hidden">
                {rides.length === 0 ? (
                  <p className="py-6 text-center text-sm text-(--text-2)">No rides found.</p>
                ) : (
                  rides.map((r) => (
                    <div key={r.id} className="rounded-lg border border-border bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{r.driver.user.name}</p>
                          <p className="text-xs text-(--text-2)">{r.source} -&gt; {r.destination}</p>
                        </div>
                        <Badge>{r.status}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-(--text-2)">
                        Created {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Driver</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Route</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Status</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-(--text-2)">
                          No rides found.
                        </td>
                      </tr>
                    ) : (
                      rides.map((r) => (
                        <tr key={r.id} className="border-b border-border">
                          <td className="py-3 font-medium text-foreground">{r.driver.user.name}</td>
                          <td className="py-3 text-(--text-2)">{r.source} -&gt; {r.destination}</td>
                          <td className="py-3"><Badge>{r.status}</Badge></td>
                          <td className="py-3 text-(--text-2)">{new Date(r.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Drivers Tab */}
          {tab === "drivers" && (
            <Card>
              <div className="space-y-3 md:hidden">
                {drivers.length === 0 ? (
                  <p className="py-6 text-center text-sm text-(--text-2)">No drivers found.</p>
                ) : (
                  drivers.map((d) => (
                    <div key={d.id} className="rounded-lg border border-border bg-white p-3">
                      {(() => {
                        const statusMeta = VERIFICATION_META[d.verificationStatus];
                        return (
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{d.user.name}</p>
                          <p className="text-xs text-(--text-2)">{d.licenseNumber || "-"}</p>
                        </div>
                        <Badge variant={statusMeta.variant}>
                          {statusMeta.label}
                        </Badge>
                      </div>
                        );
                      })()}
                      <div className="mt-2 space-y-1 text-xs text-(--text-2)">
                        <p>Vehicle: {d.vehicle ? `${d.vehicle.vehicleType} - ${d.vehicle.model}` : "-"}</p>
                        <p>Status: {d.isAvailable ? "Online" : "Offline"}</p>
                        <p>Pending Documents: {d.pendingDocumentCount ?? 0}</p>
                      </div>
                      {!!d.documents?.length && (
                        <div className="mt-3 space-y-2 rounded-lg border border-border bg-(--bg-muted) p-2">
                          {d.documents.map((document) => (
                            <div key={document.id} className="rounded-md border border-border bg-white p-2">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-[inter-semibold] text-foreground">
                                  {document.documentType.replaceAll("_", " ")}
                                </p>
                                <Badge
                                  variant={
                                    document.reviewStatus === "APPROVED"
                                      ? "success"
                                      : document.reviewStatus === "REJECTED"
                                        ? "danger"
                                        : "warning"
                                  }
                                >
                                  {document.reviewStatus}
                                </Badge>
                              </div>
                              <a
                                href={document.storageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-block text-xs font-medium text-primary underline"
                              >
                                {document.originalFileName?.trim().length
                                  ? `View ${document.originalFileName}`
                                  : "View document"}
                              </a>
                              {document.reviewStatus === "PENDING" && (
                                <div className="mt-2 flex gap-2">
                                  <Button
                                    className="w-full px-2 py-1 text-xs"
                                    isLoading={docReviewLoadingId === document.id}
                                    onClick={() =>
                                      reviewDocument(d.id, document.id, "APPROVED")
                                    }
                                  >
                                    Approve Doc
                                  </Button>
                                  <Button
                                    variant="danger"
                                    className="w-full px-2 py-1 text-xs"
                                    isLoading={docReviewLoadingId === document.id}
                                    onClick={() =>
                                      reviewDocument(d.id, document.id, "REJECTED")
                                    }
                                  >
                                    Reject Doc
                                  </Button>
                                </div>
                              )}
                              {document.reviewStatus === "REJECTED" &&
                                document.rejectionReason && (
                                  <p className="mt-1 text-xs text-(--danger)">
                                    Reason: {document.rejectionReason}
                                  </p>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        {d.verificationStatus === "VERIFIED" ? (
                          <Button
                            variant="danger"
                            className="w-full px-3 py-1 text-xs sm:w-auto"
                            isLoading={verifyLoadingId === d.id}
                            onClick={() =>
                              requestVerificationAction(d, "REVOKE")
                            }
                          >
                            Revoke
                          </Button>
                        ) : d.verificationStatus === "PENDING_REVIEW" ? (
                          <>
                            <Button
                              className="w-full px-3 py-1 text-xs sm:w-auto"
                              isLoading={verifyLoadingId === d.id}
                              onClick={() =>
                                requestVerificationAction(d, "APPROVE")
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              className="w-full px-3 py-1 text-xs sm:w-auto"
                              isLoading={verifyLoadingId === d.id}
                              onClick={() =>
                                requestVerificationAction(d, "REVOKE")
                              }
                            >
                              Revoke
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="secondary"
                            className="w-full px-3 py-1 text-xs sm:w-auto"
                            isLoading={verifyLoadingId === d.id}
                            onClick={() =>
                              requestVerificationAction(d, "REQUEST_REVIEW")
                            }
                          >
                            Move To Review
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Name</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">License</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Vehicle</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Available</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Pending Docs</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-(--text-2)">
                          No drivers found.
                        </td>
                      </tr>
                    ) : (
                    drivers.map((d) => (
                      <tr key={d.id} className="border-b border-border">
                        <td className="py-3 font-medium text-foreground">{d.user.name}</td>
                        <td className="py-3 text-(--text-2)">{d.licenseNumber || "-"}</td>
                        <td className="py-3 text-(--text-2)">
                          {d.vehicle ? `${d.vehicle.vehicleType} - ${d.vehicle.model}` : "-"}
                        </td>
                        <td className="py-3">
                          <Badge variant={d.isAvailable ? "success" : "default"}>
                            {d.isAvailable ? "Online" : "Offline"}
                          </Badge>
                        </td>
                        <td className="py-3 text-(--text-2)">{d.pendingDocumentCount ?? 0}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={VERIFICATION_META[d.verificationStatus].variant}>
                              {VERIFICATION_META[d.verificationStatus].label}
                            </Badge>
                            {d.verificationStatus === "VERIFIED" ? (
                              <Button
                                variant="danger"
                                className="px-3 py-1 text-xs"
                                isLoading={verifyLoadingId === d.id}
                                onClick={() =>
                                      requestVerificationAction(d, "REVOKE")
                                }
                              >
                                Revoke
                              </Button>
                            ) : d.verificationStatus === "PENDING_REVIEW" ? (
                              <>
                                <Button
                                  className="px-3 py-1 text-xs"
                                  isLoading={verifyLoadingId === d.id}
                                  onClick={() =>
                                    requestVerificationAction(d, "APPROVE")
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  variant="danger"
                                  className="px-3 py-1 text-xs"
                                  isLoading={verifyLoadingId === d.id}
                                  onClick={() =>
                                    requestVerificationAction(d, "REVOKE")
                                  }
                                >
                                  Revoke
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="secondary"
                                className="px-3 py-1 text-xs"
                                isLoading={verifyLoadingId === d.id}
                                onClick={() =>
                                  requestVerificationAction(d, "REQUEST_REVIEW")
                                }
                              >
                                Move To Review
                              </Button>
                            )}
                          </div>
                          {!!d.documents?.length && (
                            <div className="mt-2 space-y-2">
                              {d.documents.map((document) => (
                                <div
                                  key={document.id}
                                  className="rounded-md border border-border bg-(--bg-muted) p-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs font-[inter-semibold] text-foreground">
                                      {document.documentType.replaceAll("_", " ")}
                                    </p>
                                    <Badge
                                      variant={
                                        document.reviewStatus === "APPROVED"
                                          ? "success"
                                          : document.reviewStatus === "REJECTED"
                                            ? "danger"
                                            : "warning"
                                      }
                                    >
                                      {document.reviewStatus}
                                    </Badge>
                                  </div>
                                  <a
                                    href={document.storageUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-block text-xs font-medium text-primary underline"
                                  >
                                    {document.originalFileName?.trim().length
                                      ? `View ${document.originalFileName}`
                                      : "View document"}
                                  </a>
                                  {document.reviewStatus === "PENDING" && (
                                    <div className="mt-2 flex gap-2">
                                      <Button
                                        className="px-2 py-1 text-xs"
                                        isLoading={docReviewLoadingId === document.id}
                                        onClick={() =>
                                          reviewDocument(
                                            d.id,
                                            document.id,
                                            "APPROVED"
                                          )
                                        }
                                      >
                                        Approve Doc
                                      </Button>
                                      <Button
                                        variant="danger"
                                        className="px-2 py-1 text-xs"
                                        isLoading={docReviewLoadingId === document.id}
                                        onClick={() =>
                                          reviewDocument(
                                            d.id,
                                            document.id,
                                            "REJECTED"
                                          )
                                        }
                                      >
                                        Reject Doc
                                      </Button>
                                    </div>
                                  )}
                                  {document.reviewStatus === "REJECTED" &&
                                    document.rejectionReason && (
                                      <p className="mt-1 text-xs text-(--danger)">
                                        Reason: {document.rejectionReason}
                                      </p>
                                    )}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </>
  );
}
