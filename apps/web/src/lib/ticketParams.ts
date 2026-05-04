export {
  TicketFiltersSchema,
  TicketSortSchema,
  TicketListParamsSchema,
  TicketFilterParamsSchema,
  ViewSchema,
  TicketRowSchema,
  ListResponseSchema,
  ActivityEntrySchema,
  TicketDetailSchema,
  NewTicketDraftSchema,
  AssignPayloadSchema,
  BulkResultSchema,
} from "@shared/schema/tickets";
export {
  TicketStatusSchema,
  TicketPrioritySchema,
  UserRefSchema,
} from "@shared/schema/domain";

export type {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketFilters,
  TicketSort,
  TicketListParams,
  TicketFilterParams,
  View,
  TicketRow,
  ListResponse,
  ActivityEntry,
  TicketDetail,
  NewTicketDraft,
  AssignPayload,
  BulkResult,
} from "@shared/schema/tickets";
export type { UserRef } from "@shared/schema/domain";

import type {
  TicketFilters,
  TicketSort,
  TicketStatus,
  TicketPriority,
  TicketCategory,
} from "@shared/schema/tickets";

export function mergeFilters(
  params: URLSearchParams,
  patch: Partial<TicketFilters>,
): URLSearchParams {
  const next = new URLSearchParams(params);

  if (patch.status !== undefined) {
    if (patch.status.length === 0) {
      next.delete("status");
    } else {
      next.set("status", patch.status.join(","));
    }
  }

  if (patch.priority !== undefined) {
    if (patch.priority.length === 0) {
      next.delete("priority");
    } else {
      next.set("priority", patch.priority.join(","));
    }
  }

  if (patch.category !== undefined) {
    if (patch.category.length === 0) {
      next.delete("category");
    } else {
      next.set("category", patch.category.join(","));
    }
  }

  if (patch.assigneeIds !== undefined) {
    if (patch.assigneeIds.length === 0) {
      next.delete("assignee");
    } else {
      next.set("assignee", patch.assigneeIds.join(","));
    }
  }

  if (patch.requesterIds !== undefined) {
    if (patch.requesterIds.length === 0) {
      next.delete("requester");
    } else {
      next.set("requester", patch.requesterIds.join(","));
    }
  }

  if (patch.orgIds !== undefined) {
    if (patch.orgIds.length === 0) {
      next.delete("org");
    } else {
      next.set("org", patch.orgIds.join(","));
    }
  }

  if (patch.createdFrom !== undefined) {
    if (!patch.createdFrom) {
      next.delete("createdFrom");
    } else {
      next.set("createdFrom", patch.createdFrom);
    }
  }

  if (patch.createdTo !== undefined) {
    if (!patch.createdTo) {
      next.delete("createdTo");
    } else {
      next.set("createdTo", patch.createdTo);
    }
  }

  if (patch.q !== undefined) {
    if (!patch.q) {
      next.delete("q");
    } else {
      next.set("q", patch.q);
    }
  }

  if (patch.stale !== undefined) {
    if (!patch.stale) {
      next.delete("stale");
    } else {
      next.set("stale", "1");
    }
  }

  return next;
}

export function mergeSort(
  params: URLSearchParams,
  sort: TicketSort[],
): URLSearchParams {
  const next = new URLSearchParams(params);
  if (sort.length === 0) {
    next.delete("sort");
  } else {
    next.set("sort", serializeSort(sort));
  }
  return next;
}

export function parseFilters(params: URLSearchParams): TicketFilters {
  const filters: TicketFilters = {};

  const status = params.get("status");
  if (status) {
    filters.status = status.split(",") as TicketStatus[];
  } else {
    filters.status = [];
  }

  const priority = params.get("priority");
  if (priority) {
    filters.priority = priority.split(",") as TicketPriority[];
  } else {
    filters.priority = [];
  }

  const category = params.get("category");
  if (category) {
    filters.category = category.split(",") as TicketCategory[];
  } else {
    filters.category = [];
  }

  const assignee = params.get("assignee");
  if (assignee) {
    filters.assigneeIds = assignee.split(",");
  } else {
    filters.assigneeIds = [];
  }

  const requester = params.get("requester");
  if (requester) {
    filters.requesterIds = requester.split(",");
  } else {
    filters.requesterIds = [];
  }

  const org = params.get("org");
  if (org) {
    filters.orgIds = org.split(",");
  } else {
    filters.orgIds = [];
  }

  const createdFrom = params.get("createdFrom");
  if (createdFrom) {
    filters.createdFrom = createdFrom;
  }

  const createdTo = params.get("createdTo");
  if (createdTo) {
    filters.createdTo = createdTo;
  }

  const q = params.get("q");
  if (q) {
    filters.q = q;
  }

  const stale = params.get("stale");
  if (stale) {
    filters.stale = true;
  }

  return filters;
}

export function parseSort(params: URLSearchParams): TicketSort[] {
  const sortStr = params.get("sort");
  if (!sortStr) return [];

  return sortStr.split(",").map((item) => {
    const [field, dir] = item.split(":") as [
      TicketSort["field"],
      TicketSort["dir"],
    ];
    return { field, dir };
  });
}

export function serializeSort(sort: TicketSort[]): string {
  return sort.map((s) => `${s.field}:${s.dir}`).join(",");
}

export function buildListKey(params: object): Record<string, unknown> {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0),
  );
  const sorted = entries.sort(([a], [b]) => a.localeCompare(b));
  const result: Record<string, unknown> = {};
  for (const [key, value] of sorted) {
    if (Array.isArray(value)) {
      result[key] = [...value].sort().join(",");
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function normalizeParams<T extends object>(params: T): T {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0),
    ),
  );
  return filtered as T;
}
