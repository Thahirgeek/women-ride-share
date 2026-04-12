import StarRating from "@/components/ratings/StarRating";

interface RatingSummaryProps {
  averageScore: number | null;
  totalRatings: number;
  className?: string;
}

export default function RatingSummary({ averageScore, totalRatings, className }: RatingSummaryProps) {
  if (totalRatings <= 0) {
    return <p className={`text-xs text-(--text-3) ${className ?? ""}`}>No ratings yet</p>;
  }

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <StarRating value={Math.round((averageScore ?? 0))} size="sm" readOnly />
      <span className="text-xs text-(--text-2)">
        {(averageScore ?? 0).toFixed(1)} ({totalRatings})
      </span>
    </div>
  );
}
