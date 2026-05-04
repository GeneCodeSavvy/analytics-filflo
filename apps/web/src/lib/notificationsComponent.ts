import { CheckCircle, Eye, Mail, MessageSquare, UserPlus } from "lucide-react";
import type {
  DateBand,
  NotificationRow,
  NotificationType,
  TabKey,
} from "../types/notifications";

export const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "inbox", label: "Inbox" },
  { key: "read", label: "Read" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
];

export const filterChips: Array<{ label: string; types: NotificationType[] }> =
  [
    { label: "Assignments", types: ["TICKET_ASSIGNED"] },
    { label: "Reviews", types: ["REVIEW_REQUESTED"] },
    { label: "Invitations", types: ["TICKET_INVITATION"] },
    { label: "Resolutions", types: ["TICKET_RESOLVED", "TICKET_CLOSED"] },
    { label: "Messages", types: ["MESSAGE_ACTIVITY"] },
  ];

export const typeSummaries: Record<NotificationType, string> = {
  TICKET_ASSIGNED: "You've been assigned",
  REVIEW_REQUESTED: "Review requested",
  TICKET_INVITATION: "You've been invited",
  TICKET_RESOLVED: "Ticket resolved",
  TICKET_CLOSED: "Ticket closed",
  NEW_TICKET_IN_ORG: "New ticket in org",
  MESSAGE_ACTIVITY: "New messages",
};

export const snoozeOptions = [
  { label: "1 hour", getDate: () => new Date(Date.now() + 60 * 60 * 1000) },
  {
    label: "Tomorrow morning",
    getDate: () => {
      const value = new Date();
      value.setDate(value.getDate() + 1);
      value.setHours(9, 0, 0, 0);
      return value;
    },
  },
  {
    label: "Next week",
    getDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    label: "Custom...",
    getDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
];

export function notificationIcon(type: NotificationType) {
  if (type === "TICKET_ASSIGNED") return UserPlus;
  if (type === "REVIEW_REQUESTED") return Eye;
  if (type === "TICKET_INVITATION") return Mail;
  if (type === "MESSAGE_ACTIVITY") return MessageSquare;
  return CheckCircle;
}

export function relativeTime(value: string) {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export function dateBand(value: string): DateBand {
  const diffDays = Math.floor(
    (Date.now() - new Date(value).getTime()) / 86_400_000,
  );
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  return "Older";
}

export function ticketHref(row: NotificationRow) {
  if (!row.ticket) return "/tickets";
  return `/tickets/${encodeURIComponent(row.ticket.id)}`;
}

export function rowSummary(row: NotificationRow) {
  if (row.type === "MESSAGE_ACTIVITY" && row.eventCount > 1) {
    return `${row.eventCount} new messages`;
  }
  return typeSummaries[row.type];
}

export function selectedTypesFromChip(
  types: NotificationType[],
  active: NotificationType[],
) {
  return types.every((type) => active.includes(type));
}
