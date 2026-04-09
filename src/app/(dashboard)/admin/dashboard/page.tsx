"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import RippleWaveLoader from "@/components/RippleWaveLoader";
import BasicModal from "@/components/modal";

type Tab = "users" | "rides" | "drivers";

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
  user: { name: string; email: string };
  vehicle?: { vehicleType: string; model: string };
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<User[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyLoadingId, setVerifyLoadingId] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState<{
    driverId: string;
    driverName: string;
    action: "VERIFY" | "REVOKE";
  } | null>(null);
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
    action: "VERIFY" | "REVOKE"
  ) => {
    const isVerify = action === "VERIFY";

    setActionMessage(null);
    setVerifyLoadingId(driverId);
    try {
      const res = await fetch(`/api/admin/drivers/${driverId}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update verification status.");
      }

      await fetchDrivers();

      if (isVerify) {
        setActionMessage({ type: "success", text: "Driver verified successfully." });
      } else {
        const cancelledCount = data.cancelledOpenRides ?? 0;
        const plural = cancelledCount === 1 ? "ride" : "rides";
        setActionMessage({
          type: "success",
          text: `Driver revoked. ${cancelledCount} open ${plural} cancelled.`,
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

  const requestVerificationAction = (
    driverId: string,
    driverName: string,
    action: "VERIFY" | "REVOKE"
  ) => {
    setPendingVerification({ driverId, driverName, action });
  };

  const closeVerificationModal = () => {
    if (verifyLoadingId) return;
    setPendingVerification(null);
  };

  const confirmVerificationAction = async () => {
    if (!pendingVerification) return;

    await updateVerification(
      pendingVerification.driverId,
      pendingVerification.action
    );
    setPendingVerification(null);
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
        title={
          pendingVerification?.action === "VERIFY"
            ? "Verify Driver"
            : "Revoke Driver"
        }
        size="md"
      >
        <div className="space-y-5">
          <p className="text-sm text-(--text-2)">
            {pendingVerification?.action === "VERIFY"
              ? `Verify ${pendingVerification.driverName}? They will be able to publish rides immediately.`
              : `Revoke ${pendingVerification?.driverName}? Their OPEN rides will be cancelled.`}
          </p>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={closeVerificationModal}
              disabled={!!verifyLoadingId}
            >
              Cancel
            </Button>
            <Button
              variant={
                pendingVerification?.action === "VERIFY" ? "primary" : "danger"
              }
              onClick={confirmVerificationAction}
              isLoading={
                pendingVerification
                  ? verifyLoadingId === pendingVerification.driverId
                  : false
              }
            >
              {pendingVerification?.action === "VERIFY"
                ? "Confirm Verify"
                : "Confirm Revoke"}
            </Button>
          </div>
        </div>
      </BasicModal>

      <div className="mb-8">
        <h1 className="text-6xl font-[instrumentserif-regular] text-foreground">Admin Dashboard</h1>
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
      <div className="mb-6 flex gap-1 rounded-lg bg-(--bg-muted) border border-black/15 p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-sm px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
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
          <RippleWaveLoader />
        </div>
      ) : (
        <>
          {/* Users Tab */}
          {tab === "users" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-(--border)">
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Name</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Email</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Role</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Gender</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-(--border)">
                        <td className="py-3 font-medium text-foreground">{u.name}</td>
                        <td className="py-3 text-(--text-2)">{u.email}</td>
                        <td className="py-3"><Badge>{u.role}</Badge></td>
                        <td className="py-3 text-(--text-2)">{u.gender}</td>
                        <td className="py-3 text-(--text-2)">{new Date(u.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Rides Tab */}
          {tab === "rides" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-(--border)">
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Driver</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Route</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Status</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rides.map((r) => (
                      <tr key={r.id} className="border-b border-(--border)">
                        <td className="py-3 font-medium text-foreground">{r.driver.user.name}</td>
                        <td className="py-3 text-(--text-2)">{r.source} -&gt; {r.destination}</td>
                        <td className="py-3"><Badge>{r.status}</Badge></td>
                        <td className="py-3 text-(--text-2)">{new Date(r.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Drivers Tab */}
          {tab === "drivers" && (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-(--border)">
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Name</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">License</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Vehicle</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Available</th>
                      <th className="pb-3 text-left font-semibold text-(--text-2)">Verification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-(--text-2)">
                          No drivers found.
                        </td>
                      </tr>
                    ) : (
                    drivers.map((d) => (
                      <tr key={d.id} className="border-b border-(--border)">
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
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={d.isVerified ? "success" : "warning"}>
                              {d.isVerified ? "Verified" : "Pending"}
                            </Badge>
                            {d.isVerified ? (
                              <Button
                                variant="danger"
                                className="px-3 py-1 text-xs"
                                isLoading={verifyLoadingId === d.id}
                                onClick={() =>
                                  requestVerificationAction(
                                    d.id,
                                    d.user.name,
                                    "REVOKE"
                                  )
                                }
                              >
                                Revoke
                              </Button>
                            ) : (
                              <Button
                                className="px-3 py-1 text-xs"
                                isLoading={verifyLoadingId === d.id}
                                onClick={() =>
                                  requestVerificationAction(
                                    d.id,
                                    d.user.name,
                                    "VERIFY"
                                  )
                                }
                              >
                                Verify
                              </Button>
                            )}
                          </div>
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
