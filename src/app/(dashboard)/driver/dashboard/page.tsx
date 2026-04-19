"use client";

import { useState, useEffect } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import { WaveLoader } from "@/components/wave-loader";

interface DriverProfile {
  isAvailable: boolean;
  isVerified: boolean;
  verificationStatus: "UNVERIFIED" | "PENDING_REVIEW" | "VERIFIED" | "REVOKED";
  verificationReason?: string | null;
  currentPassengerComposition: string;
  rides: { id: string; source: string; destination: string; status: string; scheduledAt: string }[];
  _count: { rides: number };
}

export default function DriverDashboard() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    const res = await fetch("/api/driver/profile");
    const data = await res.json();
    setProfile(data.driver || null);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const toggleAvailability = async () => {
    if (!profile) return;
    setUpdating(true);
    await fetch("/api/driver/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !profile.isAvailable }),
    });
    await fetchProfile();
    setUpdating(false);
  };

  const updateComposition = async (value: string) => {
    setUpdating(true);
    await fetch("/api/driver/availability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassengerComposition: value }),
    });
    await fetchProfile();
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <WaveLoader />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <p className="text-center text-(--text-2) py-6">
          Complete your onboarding to access the driver dashboard.
        </p>
      </Card>
    );
  }

  const activeRides = profile.rides?.filter(
    (r) => r.status === "OPEN" || r.status === "BOOKED" || r.status === "ONGOING"
  ).length ?? 0;
  const completedRides = profile.rides?.filter(
    (r) => r.status === "COMPLETED"
  ).length ?? 0;
  const isVerified =
    profile.isVerified && profile.verificationStatus === "VERIFIED";

  const verificationHeadline =
    profile.verificationStatus === "UNVERIFIED"
      ? "Verification Not Started"
      : profile.verificationStatus === "PENDING_REVIEW"
        ? "Verification Pending Review"
        : profile.verificationStatus === "REVOKED"
          ? "Driver Access Revoked"
          : "Verification Pending";

  const verificationDescription =
    profile.verificationStatus === "UNVERIFIED"
      ? "Please complete onboarding and submit your documents to move into review."
      : profile.verificationStatus === "PENDING_REVIEW"
        ? "Your profile is under review. You can manage settings, but you cannot publish rides until approval."
        : profile.verificationStatus === "REVOKED"
          ? profile.verificationReason
            ? `Revocation reason: ${profile.verificationReason}`
            : "Your access to publish rides has been revoked. Contact admin to move back into review."
          : "Your profile is under review. You cannot publish rides until verification is complete.";

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-[instrumentserif-regular] text-foreground sm:text-5xl lg:text-6xl">Driver Dashboard</h1>
        <p className="mt-1 text-(--text-2)">Manage your rides and availability.</p>
      </div>

      {/* Availability + Composition controls */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-(--text-2)">Status</p>
              <p className="mt-1 text-lg font-[inter-medium] text-foreground">
                {profile.isAvailable ? "Available" : "Offline"}
              </p>
            </div>
            <button
              onClick={toggleAvailability}
              disabled={updating}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors cursor-pointer ${
                profile.isAvailable ? "bg-emerald-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                  profile.isAvailable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </Card>
        <Card>
          <Select
            id="composition"
            label="Current Passenger Composition"
            value={profile.currentPassengerComposition}
            onChange={(e) => updateComposition(e.target.value)}
            options={[
              { value: "SOLO", label: "Solo" },
              { value: "LADIES", label: "Ladies" },
              { value: "FAMILY", label: "Family" },
              { value: "MIXED", label: "Mixed" },
            ]}
          />
        </Card>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-(--text-2)">Total Rides</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {profile._count?.rides ?? profile.rides?.length ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-(--text-2)">Active Rides</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{activeRides}</p>
        </Card>
        <Card>
          <p className="text-sm text-(--text-2)">Completed</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{completedRides}</p>
        </Card>
      </div>

      {/* Verification status */}
      {!isVerified && (
        <Card className="mb-8">
          <div className="flex items-center gap-3">
            <span className="text-2xl">...</span>
            <div>
              <p className="text-sm font-[inter-medium] text-red-700">
                {verificationHeadline}
              </p>
              <p className="text-xs text-(--text-2)">
                {verificationDescription}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recent rides */}
      <h2 className="mb-4 text-xl font-[inter-semibold] text-foreground">Recent Rides</h2>
      {!profile.rides || profile.rides.length === 0 ? (
        <Card>
          <p className="text-center text-sm text-(--text-2) py-6">
            No rides created yet.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {profile.rides.slice(0, 5).map((ride) => (
            <Card key={ride.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">
                      {ride.source}
                    </span>
                    <span className="text-(--text-3)">-&gt;</span>
                    <span className="font-semibold text-foreground">
                      {ride.destination}
                    </span>
                  </div>
                  <p className="text-xs text-(--text-2) mt-1">
                    {new Date(ride.scheduledAt).toLocaleString()}
                  </p>
                </div>
                <Badge>{ride.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
