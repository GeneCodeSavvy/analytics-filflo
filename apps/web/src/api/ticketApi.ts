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
} from "../lib/ticketParams";

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

export const ticketApi = {
  getList: (
    params: TicketListParams,
    signal?: AbortSignal,
  ): Promise<ListResponse> =>
    api.get<ListResponse>("/tickets", { params, signal }),

  getById: (id: string, signal?: AbortSignal): Promise<TicketDetail> =>
    api.get<TicketDetail>(`/tickets/${id}`, { signal }),

  getViews: (signal?: AbortSignal): Promise<View[]> =>
    api.get<View[]>("/tickets/views", { signal }),

  createView: (data: CreateViewPayload): Promise<View> =>
    api.post<View>("/tickets/views", data),

  updateView: (id: string, data: UpdateViewPayload): Promise<View> =>
    api.patch<View>(`/tickets/views/${id}`, data),

  deleteView: (id: string): Promise<void> => api.delete(`/tickets/views/${id}`),

  create: (data: NewTicketDraft): Promise<TicketDetail> =>
    api.post<TicketDetail>("/tickets", data),

  update: (id: string, patch: UpdateTicketPayload): Promise<TicketDetail> =>
    api.patch<TicketDetail>(`/tickets/${id}`, patch),

  delete: (id: string): Promise<void> => api.delete(`/tickets/${id}`),

  updateStatus: (id: string, status: TicketStatus): Promise<TicketDetail> =>
    api.patch<TicketDetail>(`/tickets/${id}`, { status }),

  updatePriority: (
    id: string,
    priority: TicketPriority,
  ): Promise<TicketDetail> =>
    api.patch<TicketDetail>(`/tickets/${id}`, { priority }),

  assign: (id: string, payload: AssignPayload): Promise<TicketDetail> =>
    api.post<TicketDetail>(`/tickets/${id}/assign`, payload),

  bulkUpdate: (payload: BulkUpdatePayload): Promise<BulkResult> =>
    api.post<BulkResult>("/tickets/bulk-update", payload),

  bulkDelete: (payload: BulkDeletePayload): Promise<void> =>
    api.post("/tickets/bulk-delete", payload),

  getSince: (
    since: string,
    params: TicketFilterParams,
    signal?: AbortSignal,
  ): Promise<{ count: number }> =>
    api.get<{ count: number }>("/tickets/since", {
      params: { since, ...params },
      signal,
    }),

  getActivity: (id: string, signal?: AbortSignal): Promise<ActivityEntry[]> =>
    api.get<ActivityEntry[]>(`/tickets/${id}/activity`, { signal }),
};
