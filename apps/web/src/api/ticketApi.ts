import { api } from ".";

import type {
  TicketListParams,
  TicketFilterParams,
  ListResponse,
  TicketDetail,
  View,
  NewTicketDraft,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  AssignPayload,
  BulkResult,
  ActivityEntry,
} from "../types/tickets";

export interface CreateViewPayload {
  name: string;
  filters?: Record<string, unknown>;
  sort?: { field: string; dir: string }[];
  groupBy?: string;
}

export interface UpdateViewPayload {
  name?: string;
  filters?: Record<string, unknown>;
  sort?: { field: string; dir: string }[];
  groupBy?: string;
}

export interface UpdateTicketPayload {
  subject?: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  status?: TicketStatus;
}

export interface BulkUpdatePayload {
  ids: string[];
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  addAssignees?: string[];
  removeAssignees?: string[];
}

export interface BulkDeletePayload {
  ids: string[];
}

/**
 * Ticket API client.
 *
 * Permission model enforced by the API:
 * - SUPER_ADMIN and ADMIN can read tickets across orgs.
 * - MODERATOR and USER are scoped to their own org. If they pass another
 *   orgId in filters, the API responds with 403 instead of broadening access.
 * - Any authenticated actor may create and update tickets they can read.
 * - Assignment operations are SUPER_ADMIN-only.
 *
 * Frontend guidance:
 * - Use the viewer's role/org to disable impossible actions for UX, but keep
 *   handling 403s because the API remains the source of truth.
 * - For org-scoped users, omit orgIds unless filtering to the actor's org.
 * - Ticket views are returned only when visible to the current user: built-in,
 *   role-visible, or owned by that user. View updates/deletes are owner-only.
 */
export const ticketApi = {
  /** List tickets. Cross-org users may pass orgIds; org-scoped users should not
   * request other orgs.
   */
  getList: (
    params: TicketListParams,
    signal?: AbortSignal,
  ): Promise<ListResponse> =>
    api.get<ListResponse>("/tickets", { params, signal }),

  /** Get a ticket by id. Returns 404 when missing and 403 when the ticket is in
   * an org the current actor cannot read.
   */
  getById: (id: string, signal?: AbortSignal): Promise<TicketDetail> =>
    api.get<TicketDetail>(`/tickets/${id}`, { signal }),

  /** Return built-in, role-visible, and current-user-owned ticket views. */
  getViews: (signal?: AbortSignal): Promise<View[]> =>
    api.get<View[]>("/tickets/views", { signal }),

  /** Create a user-owned ticket view for the current actor. */
  createView: (data: CreateViewPayload): Promise<View> =>
    api.post<View>("/tickets/views", data),

  /** Update a current-user-owned view. Built-in, role, and other users' views
   * are not editable through this endpoint.
   */
  updateView: (id: string, data: UpdateViewPayload): Promise<View> =>
    api.patch<View>(`/tickets/views/${id}`, data),

  /** Delete a current-user-owned view. */
  deleteView: (id: string): Promise<void> => api.delete(`/tickets/views/${id}`),

  /** Create a ticket as the current authenticated DB user. */
  create: (data: NewTicketDraft): Promise<TicketDetail> =>
    api.post<TicketDetail>("/tickets", data),

  /** Update ticket fields when the current actor can read the ticket org. */
  update: (id: string, patch: UpdateTicketPayload): Promise<TicketDetail> =>
    api.patch<TicketDetail>(`/tickets/${id}`, patch),

  /** Delete a ticket when the current actor can read the ticket org. */
  delete: (id: string): Promise<void> => api.delete(`/tickets/${id}`),

  /** Update status when the current actor can read the ticket org. */
  updateStatus: (id: string, status: TicketStatus): Promise<TicketDetail> =>
    api.patch<TicketDetail>(`/tickets/${id}`, { status }),

  /** Update priority when the current actor can read the ticket org. */
  updatePriority: (
    id: string,
    priority: TicketPriority,
  ): Promise<TicketDetail> =>
    api.patch<TicketDetail>(`/tickets/${id}`, { priority }),

  /** Assign or unassign users on a ticket. SUPER_ADMIN-only. */
  assign: (id: string, payload: AssignPayload): Promise<TicketDetail> =>
    api.post<TicketDetail>(`/tickets/${id}/assign`, payload),

  /** Bulk update tickets.
   * Bulk assignment is SUPER_ADMIN-only. Other bulk actions are allowed only
   * for tickets in orgs the current actor can read; forbidden ticket ids are
   * returned in the failed array instead of being updated.
   */
  bulkUpdate: (payload: BulkUpdatePayload): Promise<BulkResult> =>
    api.post<BulkResult>("/tickets/bulk-update", payload),

  /** Bulk delete helper retained for frontend callers that still use it.
   * Treat this as subject to the same org-read restriction as single delete.
   */
  bulkDelete: (payload: BulkDeletePayload): Promise<void> =>
    api.post("/tickets/bulk-delete", payload),

  /** Count tickets changed since a timestamp using the same list filter rules. */
  getSince: (
    since: string,
    params: TicketFilterParams,
    signal?: AbortSignal,
  ): Promise<{ count: number }> =>
    api.get<{ count: number }>("/tickets/since", {
      params: { since, ...params },
      signal,
    }),

  /** Return activity for a ticket the current actor can read. */
  getActivity: (id: string, signal?: AbortSignal): Promise<ActivityEntry[]> =>
    api.get<ActivityEntry[]>(`/tickets/${id}/activity`, { signal }),
};
