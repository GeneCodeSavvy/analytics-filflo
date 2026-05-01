# Axios API Objects

One named export object per page. All methods call the shared `api` axios instance. Types are referenced by name — defined in a separate `types/` module.

---

## Base Setup

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor — unwrap { success: true, data: ... } envelope
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err),
);
```

---

## Dashboard

```ts
export const dashboardApi = {
  // KPI strip — 5 stat cards with deltas and sparklines
  getKpis: async (params: DashboardParams): Promise<DashboardKpis> => {
    const response = await api.get("/dashboard/kpis", { params });
    return response.data;
  },

  // Status donut breakdown
  getStatus: async (params: DashboardParams): Promise<StatusDonut> => {
    const response = await api.get("/dashboard/status", { params });
    return response.data;
  },

  // Volume bar chart (dimension is role-aware on the server)
  getVolume: async (params: DashboardParams): Promise<VolumeBar> => {
    const response = await api.get("/dashboard/volume", { params });
    return response.data;
  },

  // Created vs resolved trend line
  getTrend: async (params: DashboardParams): Promise<VolumeTrend> => {
    const response = await api.get("/dashboard/trend", { params });
    return response.data;
  },

  // Zone 3: aging tickets + recent activity + my queue (role-specific composition)
  getZone3: async (params: DashboardParams): Promise<Zone3Data> => {
    const response = await api.get("/dashboard/zone3", { params });
    return response.data;
  },
};
```

---

## Tickets

```ts
export const ticketsApi = {
  // Paginated ticket list with filters + sort
  getAll: async (params: TicketListParams): Promise<TicketList> => {
    const response = await api.get("/tickets", { params });
    return response.data;
  },

  // Single ticket with full detail (inline-editable fields)
  getById: async (id: string): Promise<TicketDetail> => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  // Create ticket — opens modal flow
  create: async (data: CreateTicketPayload): Promise<TicketDetail> => {
    const response = await api.post("/tickets", data);
    return response.data;
  },

  // Inline field update (single field at a time from detail drawer)
  update: async (id: string, data: UpdateTicketPayload): Promise<TicketDetail> => {
    const response = await api.patch(`/tickets/${id}`, data);
    return response.data;
  },

  // Delete ticket
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tickets/${id}`);
  },

  // Bulk operations — assign, status change, priority, close
  bulk: async (payload: BulkTicketPayload): Promise<BulkTicketResult> => {
    const response = await api.post("/tickets/bulk", payload);
    return response.data;
  },

  // List saved views (default views + user-created)
  getViews: async (): Promise<View[]> => {
    const response = await api.get("/tickets/views");
    return response.data;
  },

  // Save new view from current filters
  createView: async (data: CreateViewPayload): Promise<View> => {
    const response = await api.post("/tickets/views", data);
    return response.data;
  },

  // Rename or update filters on existing view
  updateView: async (id: string, data: UpdateViewPayload): Promise<View> => {
    const response = await api.patch(`/tickets/views/${id}`, data);
    return response.data;
  },

  // Delete user-created view (default views are protected)
  deleteView: async (id: string): Promise<void> => {
    await api.delete(`/tickets/views/${id}`);
  },

  // Full-text search across subject + description
  search: async (query: string, params?: TicketSearchParams): Promise<TicketRow[]> => {
    const response = await api.get("/tickets/search", { params: { q: query, ...params } });
    return response.data;
  },

  // Assign ticket to one or more users
  assign: async (id: string, data: AssignTicketPayload): Promise<TicketDetail> => {
    const response = await api.post(`/tickets/${id}/assign`, data);
    return response.data;
  },

  // Change ticket status
  updateStatus: async (id: string, status: TicketStatus): Promise<TicketDetail> => {
    const response = await api.patch(`/tickets/${id}/status`, { status });
    return response.data;
  },

  // Change ticket priority
  updatePriority: async (id: string, priority: TicketPriority): Promise<TicketDetail> => {
    const response = await api.patch(`/tickets/${id}/priority`, { priority });
    return response.data;
  },
};
```

---

## Messages

```ts
export const messagesApi = {
  // Thread list for left panel (filtered by tab: all/unread/mine/org)
  getThreads: async (filters?: MessageFilters): Promise<ThreadListRow[]> => {
    const response = await api.get("/threads", { params: filters });
    return response.data;
  },

  // Thread metadata — ticket context bar info
  getThread: async (id: string): Promise<Thread> => {
    const response = await api.get(`/threads/${id}`);
    return response.data;
  },

  // Paginated message history for a thread
  getMessages: async (threadId: string, params?: MessagePageParams): Promise<Message[]> => {
    const response = await api.get(`/threads/${threadId}/messages`, { params });
    return response.data;
  },

  // Send a message — user_message type
  send: async (threadId: string, payload: SendMessagePayload): Promise<Message> => {
    const response = await api.post(`/threads/${threadId}/messages`, payload);
    return response.data;
  },

  // Mark a specific message as read
  markRead: async (threadId: string, messageId: string): Promise<void> => {
    await api.patch(`/threads/${threadId}/messages/${messageId}/read`);
  },

  // Mark entire thread as read
  markThreadRead: async (threadId: string): Promise<void> => {
    await api.patch(`/threads/${threadId}/read`);
  },

  // List thread participants
  getParticipants: async (threadId: string): Promise<Participant[]> => {
    const response = await api.get(`/threads/${threadId}/participants`);
    return response.data;
  },

  // Upload file attachment — multipart/form-data
  uploadFile: async (threadId: string, file: File): Promise<FileAttachment> => {
    const form = new FormData();
    form.append("file", file);
    const response = await api.post(`/threads/${threadId}/files`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Delete an uploaded file before send
  deleteFile: async (threadId: string, fileId: string): Promise<void> => {
    await api.delete(`/threads/${threadId}/files/${fileId}`);
  },

  // Join a thread (Moderator — non-assigned threads)
  joinThread: async (threadId: string): Promise<void> => {
    await api.post(`/threads/${threadId}/join`);
  },

  // WebSocket URL helper — not an axios call, returns ws URL for useEffect
  getWebSocketUrl: (threadId: string): string => {
    return `${import.meta.env.VITE_WS_BASE_URL}/threads/${threadId}/ws`;
  },
};
```

---

## Notifications

```ts
export const notificationsApi = {
  // Unread count for nav bell badge
  getCount: async (): Promise<NotificationCount> => {
    const response = await api.get("/notifications/count");
    return response.data;
  },

  // Paginated notification list (tab: inbox/read/done + filters)
  getAll: async (params?: NotificationListParams): Promise<NotificationThread[]> => {
    const response = await api.get("/notifications", { params });
    return response.data;
  },

  // Move notification to read state
  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  // Archive to done state
  markDone: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/done`);
  },

  // Move back to inbox from read/done
  markUnread: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/unread`);
  },

  // Snooze — hide until a future time
  snooze: async (id: string, payload: SnoozePayload): Promise<void> => {
    await api.post(`/notifications/${id}/snooze`, payload);
  },

  // Bulk state transitions (read/done/unread/snooze on multiple items)
  bulk: async (payload: BulkNotificationPayload): Promise<void> => {
    await api.post("/notifications/bulk", payload);
  },

  // Per-type notification preferences
  getSettings: async (): Promise<NotificationSettings> => {
    const response = await api.get("/notifications/settings");
    return response.data;
  },

  // Update notification preferences (toggles, quiet hours, digest)
  updateSettings: async (data: Partial<NotificationSettings>): Promise<NotificationSettings> => {
    const response = await api.patch("/notifications/settings", data);
    return response.data;
  },

  // List tickets muted by current user
  getMutedTickets: async (): Promise<MutedTicket[]> => {
    const response = await api.get("/notifications/muted");
    return response.data;
  },

  // Unmute a ticket
  unmuteTicket: async (ticketId: string): Promise<void> => {
    await api.delete(`/notifications/muted/${ticketId}`);
  },
};
```

---

## Teams

```ts
export const teamsApi = {
  // Member list for an org — paginated, with role filter
  getMembers: async (orgId: string, params?: MemberListParams): Promise<MemberRow[]> => {
    const response = await api.get(`/orgs/${orgId}/members`, { params });
    return response.data;
  },

  // Member detail drawer — includes activity stats
  getMember: async (orgId: string, memberId: string): Promise<MemberDetail> => {
    const response = await api.get(`/orgs/${orgId}/members/${memberId}`);
    return response.data;
  },

  // Update member role (role escalation/demotion)
  updateMember: async (
    orgId: string,
    memberId: string,
    data: UpdateMemberPayload,
  ): Promise<MemberRow> => {
    const response = await api.patch(`/orgs/${orgId}/members/${memberId}`, data);
    return response.data;
  },

  // Remove member from org
  removeMember: async (orgId: string, memberId: string): Promise<void> => {
    await api.delete(`/orgs/${orgId}/members/${memberId}`);
  },

  // Bulk member operations (remove, role change)
  bulkMembers: async (orgId: string, payload: BulkMemberPayload): Promise<void> => {
    await api.post(`/orgs/${orgId}/members/bulk`, payload);
  },

  // Send invitation to email
  invite: async (orgId: string, data: InvitePayload): Promise<Invitation> => {
    const response = await api.post(`/orgs/${orgId}/invitations`, data);
    return response.data;
  },

  // List pending invitations
  getInvitations: async (orgId: string): Promise<Invitation[]> => {
    const response = await api.get(`/orgs/${orgId}/invitations`);
    return response.data;
  },

  // Cancel pending invitation
  cancelInvitation: async (orgId: string, invitationId: string): Promise<void> => {
    await api.delete(`/orgs/${orgId}/invitations/${invitationId}`);
  },

  // Resend invitation email
  resendInvitation: async (orgId: string, invitationId: string): Promise<void> => {
    await api.post(`/orgs/${orgId}/invitations/${invitationId}/resend`);
  },

  // Audit trail — role changes, removals, invitations
  getAudit: async (orgId: string, params?: AuditParams): Promise<AuditEntry[]> => {
    const response = await api.get(`/orgs/${orgId}/audit`, { params });
    return response.data;
  },

  // All orgs visible to current user (Super Admin: all, others: their orgs)
  getOrgs: async (): Promise<OrgSummary[]> => {
    const response = await api.get("/orgs");
    return response.data;
  },
};
```

---

## Settings

```ts
export const settingsApi = {
  // --- Profile ---

  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get("/users/me/profile");
    return response.data;
  },

  updateProfile: async (data: UpdateProfilePayload): Promise<UserProfile> => {
    const response = await api.patch("/users/me/profile", data);
    return response.data;
  },

  // Upload avatar — multipart/form-data
  uploadAvatar: async (file: File): Promise<UserProfile> => {
    const form = new FormData();
    form.append("avatar", file);
    const response = await api.post("/users/me/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  deleteAvatar: async (): Promise<void> => {
    await api.delete("/users/me/avatar");
  },

  // --- Security ---

  updatePassword: async (data: UpdatePasswordPayload): Promise<void> => {
    await api.patch("/users/me/password", data);
  },

  getSessions: async (): Promise<ActiveSession[]> => {
    const response = await api.get("/users/me/sessions");
    return response.data;
  },

  revokeSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/users/me/sessions/${sessionId}`);
  },

  getProviders: async (): Promise<ConnectedProvider[]> => {
    const response = await api.get("/users/me/providers");
    return response.data;
  },

  disconnectProvider: async (provider: OAuthProvider): Promise<void> => {
    await api.delete(`/users/me/providers/${provider}`);
  },

  // --- Notifications ---

  getNotificationPrefs: async (): Promise<NotificationPreference[]> => {
    const response = await api.get("/users/me/notification-preferences");
    return response.data;
  },

  updateNotificationPrefs: async (
    data: UpdateNotificationPrefsPayload,
  ): Promise<NotificationPreference[]> => {
    const response = await api.patch("/users/me/notification-preferences", data);
    return response.data;
  },

  // --- Appearance ---

  getAppearance: async (): Promise<AppearanceSettings> => {
    const response = await api.get("/users/me/appearance");
    return response.data;
  },

  updateAppearance: async (data: Partial<AppearanceSettings>): Promise<AppearanceSettings> => {
    const response = await api.patch("/users/me/appearance", data);
    return response.data;
  },

  // --- Org Settings (Super Admin only) ---

  getOrgSettings: async (orgId: string): Promise<OrgSettings> => {
    const response = await api.get(`/orgs/${orgId}/settings`);
    return response.data;
  },

  updateOrgSettings: async (orgId: string, data: UpdateOrgSettingsPayload): Promise<OrgSettings> => {
    const response = await api.patch(`/orgs/${orgId}/settings`, data);
    return response.data;
  },

  uploadOrgLogo: async (orgId: string, file: File): Promise<OrgSettings> => {
    const form = new FormData();
    form.append("logo", file);
    const response = await api.post(`/orgs/${orgId}/logo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // --- Danger Zone ---

  // Soft-deletes account after email confirmation. Blocked if user is lone Super Admin.
  deleteAccount: async (data: DeleteAccountPayload): Promise<void> => {
    await api.delete("/users/me", { data });
  },
};
```
