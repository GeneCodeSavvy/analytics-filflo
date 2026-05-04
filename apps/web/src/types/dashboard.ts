import type { IconTicket } from "@tabler/icons-react";
import type { ReactNode } from "react";
import type {
  DashboardKpis,
  KpiCard,
  SparklinePoint,
  TrendPoint,
} from "@shared/schema/dashboard";

export type * from "@shared/schema/dashboard";

export type DashboardKpiKey =
  | "totalTickets"
  | "pending"
  | "awaitingReview"
  | "resolved"
  | "avgResolutionTime";

export type DashboardKpiMeta = {
  key: DashboardKpiKey;
  icon: typeof IconTicket;
  accent: string;
  positive: "up" | "down";
};

export type DashboardKpiCards = Pick<DashboardKpis, DashboardKpiKey>;

export type ParsedKpiValue = {
  numeric: number;
  suffix: string;
};

export type SparklinePath = {
  line: string;
  fill: string;
};

export type DashboardResolutionBreakdown = {
  label: string;
  value: string;
  color: string;
};

export type DashboardTrendChartPoint = TrendPoint & {
  label: string;
  backlogRange: [number, number] | null;
};

export type SparklineProps = {
  card: KpiCard;
  accent: string;
};

export type KpiCardViewProps = SparklineProps & {
  positive: "up" | "down";
  icon: typeof IconTicket;
};

export type TrendChartProps = {
  points: TrendPoint[];
};

export type PanelProps = {
  title: string;
  count: number;
  children: ReactNode;
};

export type SparklinePathInput = Pick<SparklinePoint, "value">;
