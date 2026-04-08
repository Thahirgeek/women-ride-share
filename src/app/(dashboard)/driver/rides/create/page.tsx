"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";

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

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          totalSeats: parseInt(form.totalSeats),
          fare: parseFloat(form.fare),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create ride");
      } else {
        router.push("/driver/rides");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create a Ride</h1>
        <p className="mt-1 text-gray-500">
          Publish a new ride for passengers to book.
        </p>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="source"
              label="Source"
              placeholder="Pickup location"
              value={form.source}
              onChange={(e) => update("source", e.target.value)}
              required
            />
            <Input
              id="destination"
              label="Destination"
              placeholder="Drop-off location"
              value={form.destination}
              onChange={(e) => update("destination", e.target.value)}
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
              label="Fare per Seat (₹)"
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
              { value: "SOLO", label: "🚗 Solo" },
              { value: "LADIES", label: "👩 Ladies" },
              { value: "FAMILY", label: "👨‍👩‍👧 Family" },
              { value: "MIXED", label: "👥 Mixed" },
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
    </>
  );
}
