import z from "zod";

export const Range = z.enum(["7d", "30d", "90d", "all", "custom"]);
export const Priority = z.enum(["HIGH", "MEDIUM", "LOW"]);
export const Status = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "REVIEW",
  "ON_HOLD",
  "CLOSED",
  "RESOLVED",
]);

export const DashboardFilters = z.object({
  range: Range,
  rangeFrom: z.string().optional(),
  rangeTo: z.string().optional(),
  orgIds: z.string().array().optional(),
  priority: Priority.array().optional(),
  category: z.string().array().optional(),
});

export const SparklinePoint = z.object({
  date: z.string(),
  value: z.number(),
});

export const KpiCard = z.object({
  label: z.string(),
  value: z.union([z.number(), z.string()]),
  delta: z
    .object({
      percent: z.number(),
      direction: z.enum(["up", "down"]),
    })
    .optional(),
  sparkline: z.array(SparklinePoint),
  subline: z.string().optional(),
});

export const DashboardKpis = z.object({
  totalTickets: KpiCard,
  pending: KpiCard,
  awaitingReview: KpiCard,
  resolved: KpiCard,
  avgResolutionTime: KpiCard,
  personalVsTeamAvgResolution: z
    .object({ personal: z.string(), team: z.string() })
    .optional(),
});

export const StatusDonutSlice = z.object({
  status: Status,
  count: z.number(),
  percent: z.number(),
});

export const StatusDonut = z.object({
  total: z.number(),
  slices: StatusDonutSlice.array(),
});

export const VolumeBarSegment = z.object({
  status: Status,
  count: z.number(),
});

export const VolumeBarRow = z.object({
  dimension: z.string(),
  dimensionId: z.string(),
  total: z.number(),
  segments: VolumeBarSegment.array(),
});

export const VolumeBar = z.object({
  dimensionType: z.enum(["org", "category", "user"]),
  rows: VolumeBarRow.array(),
});

export const TrendPoint = z.object({
  date: z.string(),
  created: z.number(),
  resolved: z.number(),
});

export const VolumeTrend = z.object({
  points: TrendPoint.array(),
});

export const AgingTicket = z.object({
  id: z.string(),
  subject: z.string(),
  priority: Priority,
  createdAt: z.string(),
  ageMs: z.number(),
  isStaleHigh: z.boolean(),
});

export const ActivityEntry = z.object({
  actor: z.object({
    id: z.string(),
    name: z.string(),
    avatarUrl: z.string().optional(),
  }),
  action: z.string(),
  ticket: z.object({ id: z.string(), subject: z.string() }),
  at: z.string(),
});

export const MyQueueTicketSchema = z.object({
  id: z.string(),
  subject: z.string(),
  priority: Priority,
  status: Status,
  requester: z
    .object({
      name: z.string(),
    })
    .optional(),
  ageMs: z.number(),
});

export const OrgHealthRowSchema = z.object({
  orgId: z.string(),
  orgName: z.string(),
  openCount: z.number(),
  staleCount: z.number(),
  resolvedInRange: z.number(),
});

export const TopUserSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
  }),
  openCount: z.number(),
  highPriorityCount: z.number(),
});

export const Zone3DataSchema = z.object({
  agingTickets: AgingTicket.array().optional(),
  recentActivity: ActivityEntry.array().optional(),
  myQueue: MyQueueTicketSchema.array().optional(),
  topUsers: TopUserSchema.array().optional(),
  orgHealth: OrgHealthRowSchema.array().optional(),
});

// enums
export type Range = z.infer<typeof Range>;
export type Priority = z.infer<typeof Priority>;
export type Status = z.infer<typeof Status>;

// core filters
export type DashboardFilters = z.infer<typeof DashboardFilters>;
export type DashboardParams = DashboardFilters;

// primitives / small objects
export type SparklinePoint = z.infer<typeof SparklinePoint>;
export type TrendPoint = z.infer<typeof TrendPoint>;

// KPI + dashboard
export type KpiCard = z.infer<typeof KpiCard>;
export type DashboardKpis = z.infer<typeof DashboardKpis>;

// charts
export type StatusDonutSlice = z.infer<typeof StatusDonutSlice>;
export type StatusDonut = z.infer<typeof StatusDonut>;

export type VolumeBarSegment = z.infer<typeof VolumeBarSegment>;
export type VolumeBarRow = z.infer<typeof VolumeBarRow>;
export type VolumeBar = z.infer<typeof VolumeBar>;

export type VolumeTrend = z.infer<typeof VolumeTrend>;

// tickets + activity
export type AgingTicket = z.infer<typeof AgingTicket>;
export type ActivityEntry = z.infer<typeof ActivityEntry>;
export type MyQueueTicket = z.infer<typeof MyQueueTicketSchema>;

// org / analytics
export type OrgHealthRow = z.infer<typeof OrgHealthRowSchema>;
export type TopUser = z.infer<typeof TopUserSchema>;
export type Zone3Data = z.infer<typeof Zone3DataSchema>;
