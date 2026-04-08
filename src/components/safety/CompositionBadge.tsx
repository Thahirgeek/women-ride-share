import Badge from "@/components/ui/Badge";

interface CompositionBadgeProps {
  composition: string;
  className?: string;
}

const compositionConfig: Record<
  string,
  { label: string; emoji: string; variant: "purple" | "blue" | "gray" | "default" }
> = {
  LADIES: {
    label: "Ladies Onboard",
    emoji: "ðŸ‘©",
    variant: "default",
  },
  FAMILY: {
    label: "Family Ride",
    emoji: "ðŸ‘¨â€ðŸ‘©â€ðŸ‘§",
    variant: "blue",
  },
  MIXED: {
    label: "Mixed Group",
    emoji: "ðŸ‘¥",
    variant: "gray",
  },
  SOLO: {
    label: "Solo Driver",
    emoji: "ðŸš—",
    variant: "default",
  },
};

export default function CompositionBadge({
  composition,
  className = "",
}: CompositionBadgeProps) {
  const config = compositionConfig[composition] || compositionConfig.SOLO;

  return (
    <Badge variant={config.variant} className={className}>
      <span>{config.emoji}</span>
      {config.label}
    </Badge>
  );
}
