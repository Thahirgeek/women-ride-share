"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LocationAutocomplete from "@/components/ui/LocationAutocomplete";
import SafetyFilter from "@/components/safety/SafetyFilter";
import CompositionBadge from "@/components/safety/CompositionBadge";
import Badge from "@/components/ui/Badge";
import RatingSummary from "@/components/ratings/RatingSummary";
import { LocationSuggestion } from "@/lib/location-types";
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
    isVerified: boolean;
    user: { name: string; gender: string };
    vehicle?: { vehicleType: string; model: string; color: string };
    ratingSummary?: {
      averageScore: number | null;
      totalRatings: number;
    };
  };
}

export default function SearchRidesPage() {
  const [source, setSource] = useState("");
  const [sourceLocation, setSourceLocation] = useState<LocationSuggestion | null>(
    null
  );
  const [destination, setDestination] = useState("");
  const [destinationLocation, setDestinationLocation] =
    useState<LocationSuggestion | null>(null);
  const [date, setDate] = useState("");
  const [safetyFilter, setSafetyFilter] = useState("NONE");
  const [results, setResults] = useState<RideResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceLocation || !destinationLocation) {
      setError("Please select both locations from suggestions before searching.");
      return;
    }

    setError("");
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      params.set("source", sourceLocation.label);
      params.set("sourcePlaceId", sourceLocation.placeId);
      params.set("destination", destinationLocation.label);
      params.set("destinationPlaceId", destinationLocation.placeId);
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
        <h1 className="text-3xl font-[instrumentserif-regular] text-foreground sm:text-5xl lg:text-6xl">Search Rides</h1>
        <p className="mt-1 text-(--text-2)">
          Find safe, affordable shared rides.
        </p>
      </div>

      <Card className="mb-8">
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <LocationAutocomplete
              id="source"
              label="From"
              placeholder="Pickup location"
              value={source}
              onValueChange={setSource}
              selectedLocation={sourceLocation}
              onSelectedLocationChange={setSourceLocation}
              required
            />
            <LocationAutocomplete
              id="destination"
              label="To"
              placeholder="Drop location"
              value={destination}
              onValueChange={setDestination}
              selectedLocation={destinationLocation}
              onSelectedLocationChange={setDestinationLocation}
              required
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
          {error && (
            <p className="text-sm text-(--danger)">{error}</p>
          )}
          <Button type="submit" isLoading={loading}>
            Search Rides
          </Button>
        </form>
      </Card>

      {searched && (
        <div>
          <h2 className="mb-4 text-xl font-[inter-bold] text-foreground">
            {results.length > 0
              ? `${results.length} ride${results.length > 1 ? "s" : ""} found`
              : "No rides found"}
          </h2>
          <div className="flex flex-col gap-4">
            {results.map((ride) => (
              <Card key={ride.id}>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-400 text-sm font-[inter-bold] text-black">
                      {ride.driver.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-[inter-semibold] text-foreground">
                          {ride.driver.user.name}
                        </p>
                        {ride.driver.isVerified && (
                          <Badge variant="success">Verified</Badge>
                        )}
                      </div>
                      {ride.driver.vehicle && (
                        <p className="text-xs text-(--text-2)">
                          {ride.driver.vehicle.model} -{" "}
                          {ride.driver.vehicle.color}
                        </p>
                      )}
                      <RatingSummary
                        averageScore={ride.driver.ratingSummary?.averageScore ?? null}
                        totalRatings={ride.driver.ratingSummary?.totalRatings ?? 0}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <CompositionBadge
                    composition={ride.currentPassengerComposition}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-(--text-2) mb-2">
                  <span className="font-[inter-medium] text-foreground">
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
                  <span className="font-[inter-medium] text-foreground">
                    {ride.destination}
                  </span>
                </div>
                <div className="mb-3 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-(--text-2)">
                    {new Date(ride.scheduledAt).toLocaleString()}
                  </span>
                  <span className="font-[inter-semibold] text-foreground">
                    Rs {ride.fare} / seat
                  </span>
                </div>
                {ride.notes && (
                  <p className="text-xs text-(--text-2) mb-3 italic">
                    &quot;{ride.notes}&quot;
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Badge variant="default">
                    {ride.availableSeats} of {ride.totalSeats} seats
                  </Badge>
                  <Link href={`/passenger/book/${ride.id}`}>
                    <Button variant="primary" className="w-full px-4 py-2 text-xs sm:w-auto">
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
