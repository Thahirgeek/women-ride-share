import Card from "@/components/ui/Card";
import RatingSummary from "@/components/ratings/RatingSummary";

interface DriverProfilePreviewCardProps {
  driverName: string;
  averageScore: number | null;
  totalRatings: number;
}

export default function DriverProfilePreviewCard({
  driverName,
  averageScore,
  totalRatings,
}: DriverProfilePreviewCardProps) {
  return (
    <Card className="mb-4">
      <p className="text-xs uppercase tracking-wide text-(--text-3)">Driver</p>
      <h2 className="mt-1 text-xl font-[inter-semibold] text-foreground">{driverName}</h2>
      <RatingSummary
        averageScore={averageScore}
        totalRatings={totalRatings}
        className="mt-2"
      />
    </Card>
  );
}
