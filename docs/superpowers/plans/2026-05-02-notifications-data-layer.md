# Notifications Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full notifications data layer — Zod schemas, Axios API object, Zustand UI store, and TanStack Query hooks — with no UI components.

**Architecture:** Zod schemas live in `packages/shared/schema/notifications.ts` (shared with backend), re-exported through `apps/web/src/lib/notificationParams.ts`. Zustand store holds only ephemeral UI state (selection, expansion). All server state lives in TanStack Query via hooks in `apps/web/src/hooks/`.

**Tech Stack:** Zod, Zustand, TanStack Query v5, Axios (via shared `api` from `apps/web/src/api/index.ts`), TypeScript, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/shared/schema/notifications.ts` | Create | All Zod schemas + inferred types |
| `packages/shared/schema/index.ts` | Modify | Export notifications schemas |
| `apps/web/src/lib/notificationParams.ts` | Create | Re-export schemas + URL helpers (mergeFilters, parseFilters, buildListKey) |
| `apps/web/src/api/notificationApi.ts` | Create | Typed Axios API object |
| `apps/web/src/stores/useNotificationStore.ts` | Replace | Zustand UI-only store |
| `apps/web/src/hooks/useNotificationQueries.ts` | Create | TanStack Query read hooks |
| `apps/web/src/hooks/useNotificationMutations.ts` | Create | TanStack Query mutation hooks |
| `apps/web/src/lib/__tests__/notificationParams.test.ts` | Create | Unit tests for URL helpers |
| `apps/web/src/stores/__tests__/useNotificationStore.test.ts` | Create | Unit tests for store actions |

---

## Task 1: Zod Schemas in shared package

**Files:**
- Create: `packages/shared/schema/notifications.ts`
- Modify: `packages/shared/schema/index.ts`

- [ ] **Step 1: Create the schema file**

```ts
// packages/shared/schema/notifications.ts
import { z } from "zod";

export const NotificationStateSchema = z.enum(["inbox", "read", "done"]);
export const NotificationTierSchema = z.enum([
  "action_required",
  "status_update",
  "fyi",
]);
export const NotificationTypeSchema = z.enum([
  "ticket_assigned",
  "review_requested",
  "ticket_invitation",
  "ticket_resolved",
  "ticket_closed",
  "new_ticket_in_org",
  "message_activity",
]);

const UserRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatarUrl: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "MODERATOR", "USER"]),
  orgId: z.string(),
});

const LatestEventSchema = z.object({
  description: z.string(),
  actor: UserRefSchema,
  at: z.string(),
});

const BaseNotificationRowSchema = z.object({
  id: z.string(),
  tier: NotificationTierSchema,
  state: NotificationStateSchema,
  ticket: z.object({
    id: z.string(),
    subject: z.string(),
    orgId: z.string(),
    orgName: z.string(),
  }),
  latestEvent: LatestEventSchema,
  eventCount: z.number().int().nonnegative(),
  snoozedUntil: z.string().optional(),
});

export const NotificationRowSchema = z.discriminatedUnion("type", [
  BaseNotificationRowSchema.extend({
    type: z.literal("ticket_invitation"),
    invitationId: z.string(),
    invitationStatus: z.enum(["pending", "accepted", "rejected", "expired"]),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("ticket_assigned"),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("review_requested"),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("ticket_resolved"),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("ticket_closed"),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("new_ticket_in_org"),
  }),
  BaseNotificationRowSchema.extend({
    type: z.literal("message_activity"),
  }),
]);

export const NotificationListResponseSchema = z.object({
  rows: NotificationRowSchema.array(),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});

export const NotificationCountResponseSchema = z.object({
  inbox: z.number().int().nonnegative(),
});

export const NotificationEventSchema = z.object({
  id: z.string(),
  type: NotificationTypeSchema,
  description: z.string(),
  actor: UserRefSchema,
  at: z.string(),
});

export const NotificationThreadSchema = z.object({
  notificationGroupId: z.string(),
  events: NotificationEventSchema.array(),
});

export const NotificationFiltersSchema = z.object({
  tab: z.enum(["inbox", "read", "done", "all"]).default("inbox"),
  type: NotificationTypeSchema.array().optional(),
  ticketId: z.string().optional(),
  orgId: z.string().optional(),
});

export const NotificationListParamsSchema = NotificationFiltersSchema.extend({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().default(25),
});

export const SnoozePayloadSchema = z.object({
  snoozedUntil: z.string().datetime(),
});

export const BulkNotificationPayloadSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("read"),
    scope: z.enum(["ids", "ticket"]),
    ids: z.string().array().min(1).max(500).optional(),
    ticketId: z.string().optional(),
  }),
  z.object({
    op: z.literal("done"),
    scope: z.enum(["ids", "ticket"]),
    ids: z.string().array().min(1).max(500).optional(),
    ticketId: z.string().optional(),
  }),
  z.object({
    op: z.literal("unread"),
    scope: z.enum(["ids", "ticket"]),
    ids: z.string().array().min(1).max(500).optional(),
    ticketId: z.string().optional(),
  }),
  z.object({
    op: z.literal("snooze"),
    scope: z.literal("ids"),
    ids: z.string().array().min(1).max(500),
    snoozedUntil: z.string().datetime(),
  }),
]);

export const InvitationResponsePayloadSchema = z.object({
  response: z.enum(["accepted", "rejected"]),
});

export const NotificationPreferenceSchema = z.object({
  type: NotificationTypeSchema,
  inApp: z.boolean(),
  email: z.boolean(),
  digest: z.boolean(),
});

export const NotificationSettingsSchema = z.object({
  preferences: NotificationPreferenceSchema.array(),
  mutedTicketIds: z.string().array(),
  quietHours: z
    .object({
      from: z.string(),
      to: z.string(),
      timezone: z.string(),
    })
    .optional(),
});

export type NotificationState = z.infer<typeof NotificationStateSchema>;
export type NotificationTier = z.infer<typeof NotificationTierSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type NotificationRow = z.infer<typeof NotificationRowSchema>;
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;
export type NotificationCountResponse = z.infer<typeof NotificationCountResponseSchema>;
export type NotificationEvent = z.infer<typeof NotificationEventSchema>;
export type NotificationThread = z.infer<typeof NotificationThreadSchema>;
export type NotificationFilters = z.infer<typeof NotificationFiltersSchema>;
export type NotificationListParams = z.infer<typeof NotificationListParamsSchema>;
export type SnoozePayload = z.infer<typeof SnoozePayloadSchema>;
export type BulkNotificationPayload = z.infer<typeof BulkNotificationPayloadSchema>;
export type InvitationResponsePayload = z.infer<typeof InvitationResponsePayloadSchema>;
export type NotificationPreference = z.infer<typeof NotificationPreferenceSchema>;
export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>;
```

- [ ] **Step 2: Export from shared index**

Add to the bottom of `packages/shared/schema/index.ts`:
```ts
export * from "./notifications";
```

- [ ] **Step 3: Type-check**

```bash
pnpm check-types
```
Expected: no errors relating to `notifications`.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/schema/notifications.ts packages/shared/schema/index.ts
git commit -m "feat(schema): add notifications Zod schemas and inferred types"
```

---

## Task 2: notificationParams.ts — URL helpers and re-exports

**Files:**
- Create: `apps/web/src/lib/notificationParams.ts`
- Create: `apps/web/src/lib/__tests__/notificationParams.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// apps/web/src/lib/__tests__/notificationParams.test.ts
import { describe, it, expect } from "vitest";
import {
  parseFilters,
  mergeFilters,
  buildListKey,
  serializeTypes,
} from "../notificationParams";

describe("parseFilters", () => {
  it("returns default tab inbox when no params", () => {
    const result = parseFilters(new URLSearchParams());
    expect(result.tab).toBe("inbox");
  });

  it("parses tab from URL", () => {
    const result = parseFilters(new URLSearchParams("tab=done"));
    expect(result.tab).toBe("done");
  });

  it("parses comma-separated types", () => {
    const result = parseFilters(
      new URLSearchParams("type=ticket_assigned,review_requested")
    );
    expect(result.type).toEqual(["ticket_assigned", "review_requested"]);
  });

  it("parses ticketId and orgId", () => {
    const result = parseFilters(
      new URLSearchParams("ticketId=abc&orgId=xyz")
    );
    expect(result.ticketId).toBe("abc");
    expect(result.orgId).toBe("xyz");
  });
});

describe("mergeFilters", () => {
  it("sets tab in params", () => {
    const result = mergeFilters(new URLSearchParams(), { tab: "read" });
    expect(result.get("tab")).toBe("read");
  });

  it("removes type param when empty array", () => {
    const base = new URLSearchParams("type=ticket_assigned");
    const result = mergeFilters(base, { type: [] });
    expect(result.has("type")).toBe(false);
  });

  it("does not mutate original params", () => {
    const base = new URLSearchParams("tab=inbox");
    mergeFilters(base, { tab: "done" });
    expect(base.get("tab")).toBe("inbox");
  });
});

describe("buildListKey", () => {
  it("produces stable key regardless of object key order", () => {
    const a = buildListKey({ tab: "inbox", page: 1, pageSize: 25 });
    const b = buildListKey({ page: 1, tab: "inbox", pageSize: 25 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("omits undefined values", () => {
    const key = buildListKey({ tab: "inbox", ticketId: undefined, page: 1, pageSize: 25 });
    expect(key).not.toHaveProperty("ticketId");
  });
});

describe("serializeTypes", () => {
  it("joins types with comma", () => {
    expect(serializeTypes(["ticket_assigned", "review_requested"])).toBe(
      "ticket_assigned,review_requested"
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter web test src/lib/__tests__/notificationParams.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Implement notificationParams.ts**

```ts
// apps/web/src/lib/notificationParams.ts
export {
  NotificationStateSchema,
  NotificationTierSchema,
  NotificationTypeSchema,
  NotificationRowSchema,
  NotificationListResponseSchema,
  NotificationCountResponseSchema,
  NotificationThreadSchema,
  NotificationEventSchema,
  NotificationFiltersSchema,
  NotificationListParamsSchema,
  SnoozePayloadSchema,
  BulkNotificationPayloadSchema,
  InvitationResponsePayloadSchema,
  NotificationPreferenceSchema,
  NotificationSettingsSchema,
} from "@shared/schema";

export type {
  NotificationState,
  NotificationTier,
  NotificationType,
  NotificationRow,
  NotificationListResponse,
  NotificationCountResponse,
  NotificationThread,
  NotificationEvent,
  NotificationFilters,
  NotificationListParams,
  SnoozePayload,
  BulkNotificationPayload,
  InvitationResponsePayload,
  NotificationPreference,
  NotificationSettings,
} from "@shared/schema";

import type { NotificationFilters, NotificationType } from "@shared/schema";

export function parseFilters(params: URLSearchParams): NotificationFilters {
  const tab = (params.get("tab") ?? "inbox") as NotificationFilters["tab"];
  const typeStr = params.get("type");
  const ticketId = params.get("ticketId") ?? undefined;
  const orgId = params.get("orgId") ?? undefined;

  return {
    tab,
    type: typeStr ? (typeStr.split(",") as NotificationType[]) : undefined,
    ticketId,
    orgId,
  };
}

export function mergeFilters(
  params: URLSearchParams,
  patch: Partial<NotificationFilters>
): URLSearchParams {
  const next = new URLSearchParams(params);

  if (patch.tab !== undefined) {
    next.set("tab", patch.tab);
  }
  if (patch.type !== undefined) {
    if (patch.type.length === 0) {
      next.delete("type");
    } else {
      next.set("type", patch.type.join(","));
    }
  }
  if (patch.ticketId !== undefined) {
    if (!patch.ticketId) {
      next.delete("ticketId");
    } else {
      next.set("ticketId", patch.ticketId);
    }
  }
  if (patch.orgId !== undefined) {
    if (!patch.orgId) {
      next.delete("orgId");
    } else {
      next.set("orgId", patch.orgId);
    }
  }

  return next;
}

export function serializeTypes(types: NotificationType[]): string {
  return types.join(",");
}

export function buildListKey(params: object): Record<string, unknown> {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0)
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter web test src/lib/__tests__/notificationParams.test.ts
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/notificationParams.ts apps/web/src/lib/__tests__/notificationParams.test.ts
git commit -m "feat(web): add notificationParams URL helpers and schema re-exports"
```

---

## Task 3: Axios API object

**Files:**
- Create: `apps/web/src/api/notificationApi.ts`

- [ ] **Step 1: Create the API object**

```ts
// apps/web/src/api/notificationApi.ts
import { api } from ".";
import type {
  NotificationListParams,
  NotificationListResponse,
  NotificationCountResponse,
  NotificationThread,
  SnoozePayload,
  BulkNotificationPayload,
  InvitationResponsePayload,
  NotificationSettings,
} from "../lib/notificationParams";

export const notificationApi = {
  getList: (
    params: NotificationListParams,
    signal?: AbortSignal
  ): Promise<NotificationListResponse> =>
    api.get<NotificationListResponse>("/notifications", { params, signal }),

  getCount: (signal?: AbortSignal): Promise<NotificationCountResponse> =>
    api.get<NotificationCountResponse>("/notifications/count", { signal }),

  getThread: (
    id: string,
    signal?: AbortSignal
  ): Promise<NotificationThread> =>
    api.get<NotificationThread>(`/notifications/${id}/thread`, { signal }),

  getSettings: (signal?: AbortSignal): Promise<NotificationSettings> =>
    api.get<NotificationSettings>("/notifications/settings", { signal }),

  markRead: (id: string): Promise<void> =>
    api.patch(`/notifications/${id}`, { state: "read" }),

  markDone: (id: string): Promise<void> =>
    api.patch(`/notifications/${id}`, { state: "done" }),

  markUnread: (id: string): Promise<void> =>
    api.patch(`/notifications/${id}`, { state: "inbox" }),

  snooze: (id: string, payload: SnoozePayload): Promise<void> =>
    api.patch(`/notifications/${id}/snooze`, payload),

  bulk: (payload: BulkNotificationPayload): Promise<void> =>
    api.post("/notifications/bulk", payload),

  respondToInvitation: (
    invitationId: string,
    payload: InvitationResponsePayload
  ): Promise<void> =>
    api.post(`/notifications/invitations/${invitationId}/respond`, payload),

  muteTicket: (ticketId: string): Promise<void> =>
    api.post("/notifications/mute", { ticketId }),

  unmuteTicket: (ticketId: string): Promise<void> =>
    api.delete(`/notifications/mute/${ticketId}`),

  updateSettings: (
    data: Partial<NotificationSettings>
  ): Promise<NotificationSettings> =>
    api.patch<NotificationSettings>("/notifications/settings", data),
};
```

- [ ] **Step 2: Type-check**

```bash
pnpm check-types
```
Expected: no errors in `notificationApi.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/api/notificationApi.ts
git commit -m "feat(web): add notificationApi Axios object"
```

---

## Task 4: Zustand UI store

**Files:**
- Replace: `apps/web/src/stores/useNotificationStore.ts`
- Create: `apps/web/src/stores/__tests__/useNotificationStore.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// apps/web/src/stores/__tests__/useNotificationStore.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useNotificationStore } from "../useNotificationStore";

beforeEach(() => {
  useNotificationStore.setState({
    expandedGroupIds: {},
    selectedIds: {},
  });
});

describe("toggleGroup", () => {
  it("adds group id when not present", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.toggleGroup("abc"));
    expect(result.current.isExpanded("abc")).toBe(true);
  });

  it("removes group id when already present", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.toggleGroup("abc"));
    act(() => result.current.toggleGroup("abc"));
    expect(result.current.isExpanded("abc")).toBe(false);
  });
});

describe("isExpanded", () => {
  it("returns false for unknown id", () => {
    const { result } = renderHook(() => useNotificationStore());
    expect(result.current.isExpanded("unknown")).toBe(false);
  });
});

describe("selectRows", () => {
  it("replaces selection wholesale", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.selectRows(["a", "b", "c"]));
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.isSelected("b")).toBe(true);
    expect(result.current.isSelected("z")).toBe(false);
  });
});

describe("toggleRowSelected", () => {
  it("adds id when not selected", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.toggleRowSelected("x"));
    expect(result.current.isSelected("x")).toBe(true);
  });

  it("removes id when already selected", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.toggleRowSelected("x"));
    act(() => result.current.toggleRowSelected("x"));
    expect(result.current.isSelected("x")).toBe(false);
  });
});

describe("clearSelection", () => {
  it("empties selectedIds", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.selectRows(["a", "b"]));
    act(() => result.current.clearSelection());
    expect(result.current.isSelected("a")).toBe(false);
  });
});

describe("selectedCount", () => {
  it("returns count of selected rows", () => {
    const { result } = renderHook(() => useNotificationStore());
    act(() => result.current.selectRows(["a", "b", "c"]));
    expect(result.current.selectedCount()).toBe(3);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm --filter web test src/stores/__tests__/useNotificationStore.test.ts
```
Expected: FAIL — module not found or type mismatch with existing file.

- [ ] **Step 3: Replace the store implementation**

```ts
// apps/web/src/stores/useNotificationStore.ts
import { create } from "zustand";

interface NotificationUIState {
  expandedGroupIds: Record<string, true>;
  selectedIds: Record<string, true>;

  toggleGroup: (id: string) => void;
  isExpanded: (id: string) => boolean;
  selectRows: (ids: string[]) => void;
  toggleRowSelected: (id: string) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  selectedCount: () => number;
}

export const useNotificationStore = create<NotificationUIState>()((set, get) => ({
  expandedGroupIds: {},
  selectedIds: {},

  toggleGroup: (id) =>
    set((state) => {
      const next = { ...state.expandedGroupIds };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return { expandedGroupIds: next };
    }),

  isExpanded: (id) => !!get().expandedGroupIds[id],

  selectRows: (ids) =>
    set({
      selectedIds: Object.fromEntries(ids.map((id) => [id, true])) as Record<string, true>,
    }),

  toggleRowSelected: (id) =>
    set((state) => {
      const next = { ...state.selectedIds };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = true;
      }
      return { selectedIds: next };
    }),

  clearSelection: () => set({ selectedIds: {} }),

  isSelected: (id) => !!get().selectedIds[id],

  selectedCount: () => Object.keys(get().selectedIds).length,
}));
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm --filter web test src/stores/__tests__/useNotificationStore.test.ts
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/useNotificationStore.ts apps/web/src/stores/__tests__/useNotificationStore.test.ts
git commit -m "feat(web): replace notification store with UI-only Zustand store"
```

---

## Task 5: TanStack Query — read hooks

**Files:**
- Create: `apps/web/src/hooks/useNotificationQueries.ts`

- [ ] **Step 1: Create the queries file**

```ts
// apps/web/src/hooks/useNotificationQueries.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { notificationApi } from "../api/notificationApi";
import {
  NotificationListParamsSchema,
  buildListKey,
} from "../lib/notificationParams";
import type {
  NotificationListParams,
  NotificationListResponse,
  NotificationCountResponse,
  NotificationThread,
  NotificationSettings,
} from "../lib/notificationParams";

export function useNotificationsQuery(params: NotificationListParams) {
  const validated = NotificationListParamsSchema.parse(params);
  return useQuery<NotificationListResponse>({
    queryKey: ["notifications", "list", buildListKey(validated)],
    queryFn: ({ signal }) => notificationApi.getList(validated, signal),
    staleTime: 25_000,
    placeholderData: (prev) => prev,
    retry: 1,
  });
}

export function useNotificationCountQuery() {
  const queryClient = useQueryClient();
  const prevCountRef = useRef<number>(0);

  return useQuery<NotificationCountResponse>({
    queryKey: ["notifications", "count"],
    queryFn: ({ signal }) => notificationApi.getCount(signal),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    retry: 0,
    select: (data) => {
      if (data.inbox > prevCountRef.current) {
        queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      }
      prevCountRef.current = data.inbox;
      return data;
    },
  });
}

export function useNotificationThreadQuery(notificationId: string | null) {
  return useQuery<NotificationThread>({
    queryKey: ["notifications", "thread", notificationId],
    queryFn: ({ signal }) =>
      notificationApi.getThread(notificationId!, signal),
    enabled: !!notificationId,
    staleTime: 60_000,
  });
}

export function useNotificationSettingsQuery() {
  return useQuery<NotificationSettings>({
    queryKey: ["notifications", "settings"],
    queryFn: ({ signal }) => notificationApi.getSettings(signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm check-types
```
Expected: no errors in `useNotificationQueries.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/useNotificationQueries.ts
git commit -m "feat(web): add notification TanStack Query read hooks"
```

---

## Task 6: TanStack Query — mutation hooks

**Files:**
- Create: `apps/web/src/hooks/useNotificationMutations.ts`

- [ ] **Step 1: Create the mutations file**

```ts
// apps/web/src/hooks/useNotificationMutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { notificationApi } from "../api/notificationApi";
import type {
  NotificationRow,
  NotificationListResponse,
  NotificationState,
  BulkNotificationPayload,
  SnoozePayload,
  InvitationResponsePayload,
} from "../lib/notificationParams";

// Patches state on a single notification across all cached list pages
function patchNotificationState(
  queryClient: QueryClient,
  id: string,
  patch: Partial<NotificationRow>
) {
  queryClient.setQueriesData(
    { queryKey: ["notifications", "list"] },
    (old: unknown) => {
      if (!old) return old;
      const data = old as NotificationListResponse;
      return {
        ...data,
        rows: data.rows.map((r) =>
          r.id === id ? { ...r, ...patch } : r
        ),
      };
    }
  );
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      patchNotificationState(queryClient, id, { state: "read" as NotificationState });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useMarkDoneMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markDone(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      patchNotificationState(queryClient, id, { state: "done" as NotificationState });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useMarkUnreadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markUnread(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      patchNotificationState(queryClient, id, { state: "inbox" as NotificationState });
      return { snapshots };
    },
    onError: (_err, _id, ctx) => {
      ctx?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useSnoozeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SnoozePayload }) =>
      notificationApi.snooze(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      patchNotificationState(queryClient, id, {
        state: "done" as NotificationState,
        snoozedUntil: payload.snoozedUntil,
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useBulkMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkNotificationPayload) =>
      notificationApi.bulk(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });

      const targetState: NotificationState | null =
        payload.op === "read"
          ? "read"
          : payload.op === "done"
          ? "done"
          : payload.op === "unread"
          ? "inbox"
          : null;

      if (targetState && payload.scope === "ids" && payload.ids) {
        const idSet = new Set(payload.ids);
        queryClient.setQueriesData(
          { queryKey: ["notifications", "list"] },
          (old: unknown) => {
            if (!old) return old;
            const data = old as NotificationListResponse;
            return {
              ...data,
              rows: data.rows.map((r) =>
                idSet.has(r.id) ? { ...r, state: targetState } : r
              ),
            };
          }
        );
      } else if (targetState && payload.scope === "ticket" && payload.ticketId) {
        const ticketId = payload.ticketId;
        queryClient.setQueriesData(
          { queryKey: ["notifications", "list"] },
          (old: unknown) => {
            if (!old) return old;
            const data = old as NotificationListResponse;
            return {
              ...data,
              rows: data.rows.map((r) =>
                r.ticket.id === ticketId ? { ...r, state: targetState } : r
              ),
            };
          }
        );
      }

      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useInvitationResponseMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      invitationId,
      payload,
    }: {
      invitationId: string;
      payload: InvitationResponsePayload;
    }) => notificationApi.respondToInvitation(invitationId, payload),
    onMutate: async ({ invitationId, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      // Optimistically update invitationStatus on the matching row
      queryClient.setQueriesData(
        { queryKey: ["notifications", "list"] },
        (old: unknown) => {
          if (!old) return old;
          const data = old as NotificationListResponse;
          return {
            ...data,
            rows: data.rows.map((r) => {
              if (
                r.type === "ticket_invitation" &&
                r.invitationId === invitationId
              ) {
                return { ...r, invitationStatus: payload.response };
              }
              return r;
            }),
          };
        }
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
    },
  });
}

export function useMuteTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: string) => notificationApi.muteTicket(ticketId),
    onMutate: async (ticketId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications", "list"] });
      const snapshots = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications", "list"],
      });
      // Optimistically move all rows for this ticket to 'done'
      queryClient.setQueriesData(
        { queryKey: ["notifications", "list"] },
        (old: unknown) => {
          if (!old) return old;
          const data = old as NotificationListResponse;
          return {
            ...data,
            rows: data.rows.map((r) =>
              r.ticket.id === ticketId
                ? { ...r, state: "done" as NotificationState }
                : r
            ),
          };
        }
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) =>
        queryClient.setQueryData(key, data)
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "count"] });
    },
  });
}

export function useUpdateNotificationSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<import("../lib/notificationParams").NotificationSettings>) =>
      notificationApi.updateSettings(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["notifications", "settings"], updated);
    },
  });
}
```

- [ ] **Step 2: Type-check**

```bash
pnpm check-types
```
Expected: no errors in `useNotificationMutations.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/useNotificationMutations.ts
git commit -m "feat(web): add notification TanStack Query mutation hooks with optimistic updates"
```

---

## Task 7: Final type-check and lint pass

- [ ] **Step 1: Full type-check**

```bash
pnpm check-types
```
Expected: zero errors.

- [ ] **Step 2: Lint**

```bash
pnpm lint
```
Expected: zero errors (warnings acceptable).

- [ ] **Step 3: Run all tests**

```bash
pnpm --filter web test
```
Expected: all tests pass.

- [ ] **Step 4: Final commit if any lint fixes applied**

```bash
git add -p
git commit -m "chore: lint and type fixes for notifications data layer"
```

---

## Self-Review Checklist

- [x] Zod schemas cover all data shapes from spec §16
- [x] `discriminatedUnion` on `NotificationRowSchema` for invitation fields
- [x] `discriminatedUnion` on `BulkNotificationPayloadSchema` for snooze payload
- [x] `notificationApi` covers all endpoints from spec §17
- [x] Store has zero server state — only `expandedGroupIds` and `selectedIds`
- [x] `Record<string, true>` used for O(1) lookup on both fields
- [x] `useNotificationCountQuery` invalidates list on count increase
- [x] All mutations implement `onMutate` optimistic snapshot + `onError` rollback
- [x] `useNotificationSettingsQuery` + `useUpdateNotificationSettingsMutation` included
- [x] `buildListKey` / `parseFilters` / `mergeFilters` in notificationParams
- [x] All query keys follow `['notifications', ...]` prefix
- [x] Type names consistent across all 7 tasks
