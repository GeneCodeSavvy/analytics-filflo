import { z } from 'zod';

export const TicketStatusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'REVIEW', 'RESOLVED', 'CLOSED']);
export const TicketPrioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const TicketFiltersSchema = z.object({
  status: TicketStatusSchema.array().optional(),
  priority: TicketPrioritySchema.array().optional(),
  category: z.string().array().optional(),
  assigneeIds: z.string().array().optional(),
  requesterIds: z.string().array().optional(),
  orgIds: z.string().array().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  q: z.string().optional(),
  stale: z.boolean().optional(),
});

export const TicketSortSchema = z.object({
  field: z.enum(['updatedAt', 'createdAt', 'priority', 'status', 'subject']),
  dir: z.enum(['asc', 'desc']),
});

export const TicketListParamsSchema = TicketFiltersSchema.extend({
  sort: z.string(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  groupBy: z.string().optional(),
});

export const TicketFilterParamsSchema = TicketFiltersSchema.extend({
  sort: z.string(),
  groupBy: z.string().optional(),
});

export const ViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  scope: z.enum(['builtin', 'user']),
  ownerId: z.string().optional(),
  role: z.string().optional(),
  filters: TicketFiltersSchema,
  sort: TicketSortSchema.array(),
  groupBy: z.enum(['org', 'status', 'priority', 'assignee']).optional(),
  columns: z.string().array().optional(),
});

export const TicketRowSchema = z.object({
  id: z.string(),
  subject: z.string(),
  descriptionPreview: z.string(),
  status: z.string(),
  priority: z.string(),
  category: z.string().optional(),
  org: z.object({ id: z.string(), name: z.string() }),
  requester: z.object({ id: z.string(), name: z.string(), avatarUrl: z.string().optional(), role: z.string(), orgId: z.string() }),
  primaryAssignee: z.object({ id: z.string(), name: z.string(), avatarUrl: z.string().optional(), role: z.string(), orgId: z.string() }).optional(),
  assigneeCount: z.number(),
  assigneesPreview: z.array(z.any()),
  createdAt: z.string(),
  updatedAt: z.string(),
  isStale: z.boolean(),
  unread: z.boolean().optional(),
});

export const ListResponseSchema = z.object({
  rows: TicketRowSchema.array(),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  serverTime: z.string(),
});

export const ActivityEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['status_change', 'priority_change', 'assignee_change', 'comment', 'created', 'updated']),
  actor: z.object({ id: z.string(), name: z.string(), avatarUrl: z.string().optional() }),
  changes: z.record(z.string(), z.object({ from: z.string(), to: z.string() })).optional(),
  comment: z.string().optional(),
  createdAt: z.string(),
});

export const TicketDetailSchema = TicketRowSchema.extend({
  description: z.string(),
  activity: ActivityEntrySchema.array(),
});

export const NewTicketDraftSchema = z.object({
  subject: z.string(),
  description: z.string(),
  category: z.string().optional(),
  priority: z.string().optional(),
  inviteeIds: z.string().array(),
});

export const AssignPayloadSchema = z.object({
  add: z.string().array(),
  remove: z.string().array(),
});

export const BulkResultSchema = z.object({
  succeeded: z.string().array(),
  failed: z.array(z.object({ id: z.string(), reason: z.string() })),
});

export const UserRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatarUrl: z.string().optional(),
  role: z.string(),
  orgId: z.string(),
});

export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;
export type TicketFilters = z.infer<typeof TicketFiltersSchema>;
export type TicketSort = z.infer<typeof TicketSortSchema>;
export type TicketListParams = z.infer<typeof TicketListParamsSchema>;
export type TicketFilterParams = z.infer<typeof TicketFilterParamsSchema>;
export type View = z.infer<typeof ViewSchema>;
export type TicketRow = z.infer<typeof TicketRowSchema>;
export type ListResponse = z.infer<typeof ListResponseSchema>;
export type ActivityEntry = z.infer<typeof ActivityEntrySchema>;
export type TicketDetail = z.infer<typeof TicketDetailSchema>;
export type NewTicketDraft = z.infer<typeof NewTicketDraftSchema>;
export type AssignPayload = z.infer<typeof AssignPayloadSchema>;
export type BulkResult = z.infer<typeof BulkResultSchema>;
export type UserRef = z.infer<typeof UserRefSchema>;