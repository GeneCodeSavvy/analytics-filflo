import type { Priority, Range, Status } from "../types/dashboard";

export const DASHBOARD_STALE_MS = 5 * 60 * 1000;

export const VALID_RANGES: Range[] = ["7d", "30d", "90d", "all", "custom"];

export const VALID_PRIORITIES: Priority[] = ["HIGH", "MEDIUM", "LOW"];

export const STATUS_COLORS: Record<Status, string> = {
  OPEN: "#6B7280",
  IN_PROGRESS: "#3B82F6",
  ON_HOLD: "#F59E0B",
  REVIEW: "#8B5CF6",
  RESOLVED: "#10B981",
  CLOSED: "#1F2937",
};
