import type {
  Density,
  TicketCategory,
  TicketFilters,
  TicketPriority,
  FlatTicketRow,
  TicketGroup,
  TicketRow,
  TicketSort,
  TicketStatus,
  UserRef,
} from "../types/tickets";

export const STATUSES: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "ON_HOLD",
  "REVIEW",
  "RESOLVED",
];
export const PRIORITIES: TicketPriority[] = ["HIGH", "MEDIUM", "LOW"];
export const CATEGORIES: TicketCategory[] = ["BUG", "FEATURE_REQUEST"];
export const FILTERS = ["Status", "Priority", "Category", "Assignee", "Date"];
export const DEFAULT_VIEWS = [
  { id: null, name: "All tickets" },
  { id: "awaiting-review", name: "Awaiting my review" },
  { id: "high-priority", name: "High priority open" },
  { id: "stale", name: "Stale" },
];
export function viewToFilters(viewId: string | null, userId?: string): Partial<TicketFilters> {
  switch (viewId) {
    case "awaiting-review":
      return {
        status: ["REVIEW"],
        ...(userId ? { assigneeIds: [userId] } : {}),
      };
    case "high-priority":
      return {
        priority: ["HIGH"],
        status: ["OPEN", "IN_PROGRESS", "ON_HOLD", "REVIEW"],
      };
    case "stale":
      return { stale: true };
    default:
      return {};
  }
}

export const ROW_HEIGHT: Record<Density, number> = {
  compact: 36,
  comfortable: 56,
};
export const OVERSCAN = 8;

export function statusClass(status: string) {
  if (status === "OPEN") return "bg-[--status-success-bg] text-[--status-success-fg]";
  if (status === "IN_PROGRESS") return "bg-[--status-info-bg] text-[--status-info-fg]";
  if (status === "REVIEW") {
    return "bg-[--status-warn-bg] text-[--status-warn-fg]";
  }
  if (status === "RESOLVED") {
    return "bg-[--status-neutral-bg] text-[--status-neutral-fg] line-through";
  }
  return "bg-[--status-neutral-bg] text-[--status-neutral-fg]";
}

export function priorityBar(priority: string) {
  if (priority === "HIGH") return "bg-[--status-danger-fg]";
  if (priority === "MEDIUM") return "bg-[--status-warn-fg]";
  return "bg-[--status-success-fg]";
}

export function displayId(id: string) {
  return `#${id.replace(/-/g, "").slice(0, 8)}`;
}

export function relativeTime(value: string) {
  const then = new Date(value).getTime();
  const diff = Date.now() - then;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 2 * day) return "Yesterday";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function absoluteTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function uniqueAssignees(row: TicketRow) {
  return [row.primaryAssignee, ...((row.assigneesPreview ?? []) as UserRef[])]
    .filter(Boolean)
    .filter(
      (user, index, list) =>
        list.findIndex((item) => item?.id === user?.id) === index,
    ) as UserRef[];
}

export function sortTicketRows(rows: TicketRow[], sort: TicketSort[]) {
  const list = [...rows];
  const priorityOrder = new Map([
    ["HIGH", 0],
    ["MEDIUM", 1],
    ["LOW", 2],
  ]);
  const statusOrder = new Map(STATUSES.map((item, index) => [item, index]));
  const sorts = sort.length
    ? sort
    : ([{ field: "updatedAt", dir: "desc" }] as TicketSort[]);

  list.sort((a, b) => {
    for (const item of sorts) {
      let result = 0;
      if (item.field === "updatedAt" || item.field === "createdAt") {
        result =
          new Date(a[item.field]).getTime() - new Date(b[item.field]).getTime();
      }
      if (item.field === "subject") result = a.subject.localeCompare(b.subject);
      if (item.field === "priority") {
        result =
          (priorityOrder.get(a.priority) ?? 3) -
          (priorityOrder.get(b.priority) ?? 3);
      }
      if (item.field === "status") {
        result =
          (statusOrder.get(a.status as TicketStatus) ?? 9) -
          (statusOrder.get(b.status as TicketStatus) ?? 9);
      }
      if (result !== 0) return item.dir === "asc" ? result : -result;
    }
    return 0;
  });

  return list;
}

export function groupTicketRows(
  rows: TicketRow[],
  groupByOrg: boolean,
  role: string,
): TicketGroup[] {
  if (!groupByOrg || role !== "SUPER_ADMIN") return [{ org: "", rows }];

  const groups = new Map<string, TicketRow[]>();
  for (const row of rows) {
    groups.set(row.org.name, [...(groups.get(row.org.name) ?? []), row]);
  }

  return [...groups.entries()].map(([org, groupRows]) => ({
    org,
    rows: groupRows,
  }));
}

export function flattenTicketGroups(groups: TicketGroup[]): FlatTicketRow[] {
  return groups.flatMap((group) =>
    group.org
      ? [
          { kind: "group" as const, id: group.org, group },
          ...group.rows.map((row) => ({
            kind: "row" as const,
            id: row.id,
            row,
          })),
        ]
      : group.rows.map((row) => ({ kind: "row" as const, id: row.id, row })),
  );
}
