import Badge from "@/components/ui/Badge";

interface CompositionBadgeProps {
  composition: string;
  className?: string;
}

const compositionConfig: Record<
  string,
  {
    label: string;
    emoji: string;
    variant: "default" | "info" | "pending" | "gray";
  }
> = {
  LADIES: {
    label: "Ladies Onboard",
    emoji: "[W]",
    variant: "default",
  },
  FAMILY: {
    label: "Family Ride",
    emoji: "[F]",
    variant: "info",
  },
  MIXED: {
    label: "Mixed Group",
    emoji: "[M]",
    variant: "pending",
  },
  SOLO: {
    label: "Solo Driver",
    emoji: "[D]",
    variant: "default",
  },
};

export default function CompositionBadge({
  composition,
  className = "",
}: CompositionBadgeProps) {
  const config = compositionConfig[composition] || compositionConfig.SOLO;
  const compositionBadgeClassName = `w-fit shrink-0 justify-center text-center whitespace-nowrap ${className}`;

  return (
    <Badge variant={config.variant} className={compositionBadgeClassName}>
      {config.label}
    </Badge>
  );
}
