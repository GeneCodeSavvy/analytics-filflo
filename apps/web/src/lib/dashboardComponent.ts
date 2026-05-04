import {
  IconCheck,
  IconCircleCheck,
  IconClock,
  IconTicket,
  IconTrendingUp,
} from "@tabler/icons-react";
import type {
  DashboardKpiMeta,
  DashboardResolutionBreakdown,
  DashboardTrendChartPoint,
  KpiCard,
  ParsedKpiValue,
  Range,
  SparklinePath,
  SparklinePathInput,
  Status,
  TrendPoint,
} from "../types/dashboard";

export const dashboardRanges: Range[] = ["7d", "30d", "90d", "all"];

export const muted = "#9CA3AF";
export const amber = "oklch(0.6716 0.1368 48.5130)";
export const teal = "oklch(0.5360 0.0398 196)";
export const resolved = "oklch(0.5940 0.0443 196)";
export const review = "oklch(0.6268 0 0)";
export const warning = "oklch(0.6368 0.2078 25)";

export const dashboardStatusColor: Record<Status, string> = {
  OPEN: "#D97706",
  IN_PROGRESS: teal,
  REVIEW: review,
  ON_HOLD: "#D97706",
  CLOSED: "#D1CEC7",
  RESOLVED: resolved,
};

export const dashboardPriorityColor = {
  HIGH: warning,
  MEDIUM: "#D97706",
  LOW: resolved,
} as const;

export const dashboardKpiMeta = [
  { key: "totalTickets", icon: IconTicket, accent: amber, positive: "up" },
  { key: "pending", icon: IconClock, accent: "#D97706", positive: "down" },
  {
    key: "awaitingReview",
    icon: IconTrendingUp,
    accent: review,
    positive: "down",
  },
  { key: "resolved", icon: IconCircleCheck, accent: resolved, positive: "up" },
  { key: "avgResolutionTime", icon: IconCheck, accent: teal, positive: "down" },
] satisfies DashboardKpiMeta[];

export const dashboardResolutionBreakdown: DashboardResolutionBreakdown[] = [
  { label: "HIGH", value: "4h", color: dashboardPriorityColor.HIGH },
  { label: "MED", value: "1.2d", color: dashboardPriorityColor.MEDIUM },
  { label: "LOW", value: "3.5d", color: dashboardPriorityColor.LOW },
];

export function formatDashboardNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function parseKpiValue(value: KpiCard["value"]): ParsedKpiValue {
  if (typeof value === "number") return { numeric: value, suffix: "" };

  const match = value.match(/^([\d.]+)(.*)$/);

  return {
    numeric: match ? Number(match[1]) : 0,
    suffix: match ? match[2] : value,
  };
}

export function getSparklinePath(
  points: SparklinePathInput[],
): SparklinePath {
  if (!points.length) return { line: "", fill: "" };

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = Math.max(max - min, 1);
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
    const y = 28 - ((point.value - min) / spread) * 24;
    return [x, y] as const;
  });
  const line = coords
    .map(
      ([x, y], index) =>
        `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`,
    )
    .join(" ");
  const fill = `${line} L 100 32 L 0 32 Z`;

  return { line, fill };
}

export function getTrendChartData(
  points: TrendPoint[],
): DashboardTrendChartPoint[] {
  return points.map((point) => ({
    ...point,
    label: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    backlogRange:
      point.created > point.resolved ? [point.resolved, point.created] : null,
  }));
}

export function ageLabel(ms: number) {
  const days = ms / 86_400_000;

  if (days >= 1) return `${days.toFixed(days >= 10 ? 0 : 1)}d`;

  return `${Math.max(1, Math.round(ms / 3_600_000))}h`;
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diff / 60_000));

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  return `${Math.round(hours / 24)}d ago`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function avatarColor(name: string) {
  const colors = ["#0F766E", "#92400E", "#525252", "#047857", "#A16207"];
  const total = name
    .split("")
    .reduce((sum, char) => sum + char.charCodeAt(0), 0);

  return colors[total % colors.length];
}
