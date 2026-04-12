"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import StarRating from "@/components/ratings/StarRating";
import FeedbackTagPicker from "@/components/ratings/FeedbackTagPicker";
import DriverProfilePreviewCard from "@/components/ratings/DriverProfilePreviewCard";
import { WaveLoader } from "@/components/wave-loader";
import { type FeedbackTag } from "@/lib/feedback";

interface RateDriverData {
  ride: {
    id: string;
    source: string;
    destination: string;
    status: string;
    scheduledAt: string;
  };
  driver: {
    id: string;
    userId: string;
    name: string;
    ratingSummary: {
      averageScore: number | null;
      totalRatings: number;
    };
  };
  rating: {
    id: string;
    score: number;
    comment: string | null;
    tags: FeedbackTag[];
    createdAt: string;
    canEdit: boolean;
    editDeadline: string;
  } | null;
  canSubmit: boolean;
}

export default function RateDriverPage({
  params,
}: {
  params: Promise<{ rideId: string }>;
}) {
  const { rideId } = use(params);

  const [data, setData] = useState<RateDriverData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<FeedbackTag[]>([]);

  const fetchFeedbackState = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ratings?rideId=${encodeURIComponent(rideId)}`, {
        cache: "no-store",
      });
      const payload = await res.json();

      if (!res.ok) {
        setError(payload.error || "Unable to load feedback details");
        setData(null);
        return;
      }

      setData(payload as RateDriverData);
      setError("");
      setSuccessMessage("");

      if (payload.rating) {
        setScore(payload.rating.score);
        setComment(payload.rating.comment || "");
        setTags(Array.isArray(payload.rating.tags) ? payload.rating.tags : []);
      }
    } catch {
      setError("Unable to load feedback details");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  useEffect(() => {
    fetchFeedbackState();
  }, [fetchFeedbackState]);

  const handleSubmit = async () => {
    if (!data) return;

    if (!data.canSubmit) {
      setError("Feedback can be submitted only after ride completion.");
      return;
    }

    if (!score) {
      setError("Please select a star rating.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const hasExisting = Boolean(data.rating);
      const endpoint = hasExisting ? `/api/ratings/${data.rating?.id}` : "/api/ratings";
      const method = hasExisting ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rideId: data.ride.id,
          score,
          comment,
          tags,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || "Unable to submit feedback");
        return;
      }

      setSuccessMessage(hasExisting ? "Feedback updated." : "Feedback submitted.");
      await fetchFeedbackState();
    } catch {
      setError("Unable to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <WaveLoader />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <p className="text-sm text-red-600">{error || "Feedback details unavailable."}</p>
        <div className="mt-4">
          <Link href="/passenger/bookings">
            <Button variant="secondary">Back to Bookings</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const readOnly = Boolean(data.rating) && !data.rating.canEdit;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-6xl font-[instrumentserif-regular] text-foreground">Rate Driver</h1>
        <p className="mt-1 text-(--text-2)">
          {data.ride.source} -&gt; {data.ride.destination}
        </p>
      </div>

      <DriverProfilePreviewCard
        driverName={data.driver.name}
        averageScore={data.driver.ratingSummary.averageScore}
        totalRatings={data.driver.ratingSummary.totalRatings}
      />

      <Card>
        {!data.canSubmit && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Feedback is available only when the ride status is COMPLETED.
          </p>
        )}

        {readOnly && data.rating && (
          <p className="mb-4 rounded-lg border border-border bg-(--bg-muted) px-3 py-2 text-sm text-(--text-2)">
            Editing window closed on {new Date(data.rating.editDeadline).toLocaleString()}.
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-[inter-medium] text-foreground">Overall rating</p>
            <StarRating value={score} onChange={readOnly ? undefined : setScore} readOnly={readOnly} />
          </div>

          <div>
            <p className="mb-2 text-sm font-[inter-medium] text-foreground">What stood out?</p>
            <FeedbackTagPicker
              selected={tags}
              onChange={readOnly ? () => undefined : setTags}
            />
          </div>

          <div>
            <label htmlFor="feedback-comment" className="mb-2 block text-sm font-[inter-medium] text-foreground">
              Comment (optional)
            </label>
            <textarea
              id="feedback-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              disabled={readOnly}
              rows={4}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-(--primary)/30 disabled:cursor-not-allowed disabled:bg-(--bg-muted)"
              placeholder="Share your experience with the driver..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSubmit}
              isLoading={submitting}
              disabled={!data.canSubmit || readOnly}
            >
              {data.rating ? "Update Feedback" : "Submit Feedback"}
            </Button>
            <Link href="/passenger/bookings">
              <Button variant="secondary">Back to Bookings</Button>
            </Link>
          </div>
        </div>
      </Card>
    </>
  );
}
