export type Range = "7d" | "30d" | "90d" | "all" | "custom";
export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type Status =
  | "OPEN"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "REVIEW"
  | "RESOLVED"
  | "CLOSED";

export interface DashboardFilters {
  range: Range;
  rangeFrom?: string;
  rangeTo?: string;
  orgIds?: string[];
  priority?: Priority[];
  category?: string[];
}

export interface SparklinePoint {
  date: string;
  value: number;
}

export interface KpiCard {
  label: string;
  value: number | string;
  delta?: { percent: number; direction: "up" | "down" };
  sparkline: SparklinePoint[];
  subline?: string;
}

export interface DashboardKpis {
  totalTickets: KpiCard;
  pending: KpiCard;
  awaitingReview: KpiCard;
  resolved: KpiCard;
  avgResolutionTime: KpiCard;
  personalVsTeamAvgResolution?: { personal: string; team: string };
}

export interface StatusDonutSlice {
  status: Status;
  count: number;
  percent: number;
}

export interface StatusDonut {
  total: number;
  slices: StatusDonutSlice[];
}

export interface VolumeBarSegment {
  status: Status;
  count: number;
}

export interface VolumeBarRow {
  dimension: string;
  dimensionId: string;
  total: number;
  segments: VolumeBarSegment[];
}

export interface VolumeBar {
  dimensionType: "org" | "category" | "user";
  rows: VolumeBarRow[];
}

export interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface VolumeTrend {
  points: TrendPoint[];
}

export interface AgingTicket {
  id: string;
  subject: string;
  priority: Priority;
  createdAt: string;
  ageMs: number;
  isStaleHigh: boolean;
}

export interface ActivityEntry {
  actor: { id: string; name: string; avatarUrl?: string };
  action: string;
  ticket: { id: string; subject: string };
  at: string;
}

export interface MyQueueTicket {
  id: string;
  subject: string;
  priority: Priority;
  status: Status;
  requester?: { name: string };
  ageMs: number;
}

export interface OrgHealthRow {
  orgId: string;
  orgName: string;
  openCount: number;
  staleCount: number;
  resolvedInRange: number;
}

export interface Zone3Data {
  agingTickets?: AgingTicket[];
  recentActivity?: ActivityEntry[];
  myQueue?: MyQueueTicket[];
  topUsers?: {
    user: { id: string; name: string };
    openCount: number;
    highPriorityCount: number;
  }[];
  orgHealth?: OrgHealthRow[];
}

export type DashboardParams = DashboardFilters;
