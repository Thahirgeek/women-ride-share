"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SafetyFilter from "@/components/safety/SafetyFilter";
import CompositionBadge from "@/components/safety/CompositionBadge";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

interface RideResult {
  id: string;
  source: string;
  destination: string;
  scheduledAt: string;
  fare: number;
  availableSeats: number;
  totalSeats: number;
  currentPassengerComposition: string;
  notes?: string;
  driver: {
    user: { name: string; gender: string };
    vehicle?: { vehicleType: string; model: string; color: string };
  };
}

export default function SearchRidesPage() {
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [safetyFilter, setSafetyFilter] = useState("NONE");
  const [results, setResults] = useState<RideResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (source) params.set("source", source);
      if (destination) params.set("destination", destination);
      if (date) params.set("date", date);
      if (safetyFilter !== "NONE") params.set("safetyFilter", safetyFilter);

      const res = await fetch(`/api/rides?${params}`);
      const data = await res.json();
      setResults(data.rides || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Search Rides</h1>
        <p className="mt-1 text-(--text-2)">
          Find safe, affordable shared rides.
        </p>
      </div>

      <Card className="mb-8">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="source"
              label="From"
              placeholder="Pickup location"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
            <Input
              id="destination"
              label="To"
              placeholder="Drop location"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
          <Input
            id="date"
            label="Date & Time"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <SafetyFilter value={safetyFilter} onChange={setSafetyFilter} />
          <Button type="submit" isLoading={loading}>
            Search Rides
          </Button>
        </form>
      </Card>

      {searched && (
        <div>
          <h2 className="mb-4 text-xl font-bold text-foreground">
            {results.length > 0
              ? `${results.length} ride${results.length > 1 ? "s" : ""} found`
              : "No rides found"}
          </h2>
          <div className="flex flex-col gap-4">
            {results.map((ride) => (
              <Card key={ride.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--bg-muted) text-sm font-bold text-(--text-2)">
                      {ride.driver.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {ride.driver.user.name}
                      </p>
                      {ride.driver.vehicle && (
                        <p className="text-xs text-(--text-2)">
                          {ride.driver.vehicle.model} -{" "}
                          {ride.driver.vehicle.color}
                        </p>
                      )}
                    </div>
                  </div>
                  <CompositionBadge
                    composition={ride.currentPassengerComposition}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-(--text-2) mb-2">
                  <span className="font-medium text-foreground">
                    {ride.source}
                  </span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                  <span className="font-medium text-foreground">
                    {ride.destination}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-(--text-2)">
                    {new Date(ride.scheduledAt).toLocaleString()}
                  </span>
                  <span className="font-semibold text-foreground">
                    Rs {ride.fare} / seat
                  </span>
                </div>
                {ride.notes && (
                  <p className="text-xs text-(--text-2) mb-3 italic">
                    &quot;{ride.notes}&quot;
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="default">
                    {ride.availableSeats} of {ride.totalSeats} seats
                  </Badge>
                  <Link href={`/passenger/book/${ride.id}`}>
                    <Button variant="primary" className="text-xs px-4 py-2">
                      Book Ride -&gt;
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
