"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LocationAutocomplete from "@/components/ui/LocationAutocomplete";
import Select from "@/components/ui/Select";
import { WaveLoader } from "@/components/wave-loader";
import { LocationSuggestion } from "@/lib/location-types";

type DriverVerificationStatus =
  | "UNVERIFIED"
  | "PENDING_REVIEW"
  | "VERIFIED"
  | "REVOKED";

export default function CreateRidePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    source: "",
    destination: "",
    scheduledAt: "",
    totalSeats: "4",
    fare: "",
    currentPassengerComposition: "SOLO",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusLoading, setStatusLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] =
    useState<DriverVerificationStatus | null>(null);
  const [verificationReason, setVerificationReason] = useState<string | null>(
    null
  );
  const [sourceLocation, setSourceLocation] = useState<LocationSuggestion | null>(
    null
  );
  const [destinationLocation, setDestinationLocation] =
    useState<LocationSuggestion | null>(null);

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    let active = true;

    const fetchDriverStatus = async () => {
      try {
        const res = await fetch("/api/driver/profile");
        const data = await res.json();

        if (!active) return;

        const driver = data.driver;
        if (!driver) {
          setError("Complete onboarding before publishing rides.");
          setVerificationStatus("UNVERIFIED");
          setStatusLoading(false);
          return;
        }

        if (!driver.isVerified || driver.verificationStatus !== "VERIFIED") {
          setVerificationStatus(driver.verificationStatus || "UNVERIFIED");
          setVerificationReason(driver.verificationReason || null);
          setStatusLoading(false);
          return;
        }

        setVerificationStatus("VERIFIED");
        setStatusLoading(false);
      } catch {
        if (!active) return;
        setError("Unable to load driver verification status.");
        setStatusLoading(false);
      }
    };

    fetchDriverStatus();

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!sourceLocation || !destinationLocation) {
      setError("Please select source and destination from location suggestions.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLocation,
          destinationLocation,
          scheduledAt: form.scheduledAt,
          currentPassengerComposition: form.currentPassengerComposition,
          notes: form.notes,
          totalSeats: parseInt(form.totalSeats),
          fare: parseFloat(form.fare),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === "DRIVER_NOT_VERIFIED") {
          if (data.verificationStatus === "UNVERIFIED") {
            setError(
              "Complete onboarding and submit your documents for review before publishing rides."
            );
          } else if (data.verificationStatus === "PENDING_REVIEW") {
            setError(
              "Your profile is under review. An admin must approve your account before you can publish rides."
            );
          } else if (data.verificationStatus === "REVOKED") {
            setError(
              "Your driver access is currently revoked. Contact support or request review from admin."
            );
          } else {
            setError(
              "Your driver profile is not verified yet. An admin must verify your account before you can publish rides."
            );
          }
        } else {
          setError(data.error || "Failed to create ride");
        }
      } else {
        router.push("/driver/rides");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isBlocked =
    verificationStatus !== null && verificationStatus !== "VERIFIED";

  const blockingTitle =
    verificationStatus === "UNVERIFIED"
      ? "Verification Not Started"
      : verificationStatus === "PENDING_REVIEW"
        ? "Verification Pending"
        : verificationStatus === "REVOKED"
          ? "Driver Access Revoked"
          : "Unable To Publish";

  const blockingMessage =
    verificationStatus === "UNVERIFIED"
      ? "Complete onboarding and submit your documents for admin review before publishing rides."
      : verificationStatus === "PENDING_REVIEW"
        ? "Your profile is under review. You cannot publish rides until admin approval."
        : verificationStatus === "REVOKED"
          ? verificationReason
            ? `Revocation reason: ${verificationReason}`
            : "Your driver access is currently revoked. Contact admin support."
          : "Driver verification is required before publishing rides.";

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <WaveLoader />
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-[instrumentserif-regular] text-foreground sm:text-5xl lg:text-6xl">Create a Ride</h1>
        <p className="mt-1 text-(--text-2)">
          Publish a new ride for passengers to book.
        </p>
      </div>

      {isBlocked && (
        <Card className="mb-6 border border-amber-200 bg-amber-50">
          <p className="text-sm font-[inter-semibold] text-amber-800">{blockingTitle}</p>
          <p className="mt-1 text-sm text-amber-700">{blockingMessage}</p>
          <div className="mt-4 flex gap-3">
            <Button variant="secondary" onClick={() => router.push("/driver/dashboard")}>Go To Dashboard</Button>
            <Button onClick={() => router.push("/profile")}>Upload Documents</Button>
          </div>
        </Card>
      )}

      {!isBlocked && (
      <Card className="max-w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <LocationAutocomplete
              id="source"
              label="Source"
              placeholder="Pickup location"
              value={form.source}
              onValueChange={(value) => update("source", value)}
              selectedLocation={sourceLocation}
              onSelectedLocationChange={setSourceLocation}
              required
            />
            <LocationAutocomplete
              id="destination"
              label="Destination"
              placeholder="Drop-off location"
              value={form.destination}
              onValueChange={(value) => update("destination", value)}
              selectedLocation={destinationLocation}
              onSelectedLocationChange={setDestinationLocation}
              required
            />
          </div>
          <Input
            id="scheduledAt"
            label="Schedule Date & Time"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={(e) => update("scheduledAt", e.target.value)}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="totalSeats"
              label="Total Seats"
              type="number"
              min="1"
              max="12"
              value={form.totalSeats}
              onChange={(e) => update("totalSeats", e.target.value)}
              required
            />
            <Input
              id="fare"
              label="Fare per Seat (Rs)"
              type="number"
              min="1"
              step="0.5"
              value={form.fare}
              onChange={(e) => update("fare", e.target.value)}
              required
            />
          </div>
          <Select
            id="composition"
            label="Current Passenger Composition"
            value={form.currentPassengerComposition}
            onChange={(e) => update("currentPassengerComposition", e.target.value)}
            options={[
              { value: "SOLO", label: "Solo" },
              { value: "LADIES", label: "Ladies" },
              { value: "FAMILY", label: "Family" },
              { value: "MIXED", label: "Mixed" },
            ]}
          />
          <Input
            id="notes"
            label="Notes (optional)"
            placeholder="e.g. Comfortable family ride, kids welcome"
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
          <Button type="submit" isLoading={loading} fullWidth>
            Publish Ride
          </Button>
        </form>
      </Card>
      )}
    </>
  );
}
