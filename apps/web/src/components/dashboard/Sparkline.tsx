import { useMemo } from "react";
import { getSparklinePath } from "../../lib/dashboardComponent";
import type { SparklineProps } from "../../types/dashboard";

export function Sparkline({ card, accent }: SparklineProps) {
  const points = card.sparkline;
  const path = useMemo(() => getSparklinePath(points), [points]);

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-full">
      <path d={path.fill} fill={accent} opacity="0.08" />
      <path
        d={path.line}
        fill="none"
        stroke={accent}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
        opacity="0.6"
        className="dashboard-sparkline-path"
      />
    </svg>
  );
}
