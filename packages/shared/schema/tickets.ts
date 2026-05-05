import { z } from "zod";
import {
  DeleteResponseSchema,
  IdParamsSchema,
  OrgRefSchema,
  TicketCategorySchema,
  TicketParticipantRoleSchema,
  TicketPrioritySchema,
  TicketStatusSchema,
  UserRefSchema,
  UserRoleSchema,
  ViewScopeSchema,
} from "./domain";

export const TicketFiltersSchema = z.object({
  status: TicketStatusSchema.array().optional(),
  priority: TicketPrioritySchema.array().optional(),
  category: TicketCategorySchema.array().optional(),
  assigneeIds: z.string().array().optional(),
  requesterIds: z.string().array().optional(),
  orgIds: z.string().array().optional(),
  createdFrom: z.string().optional(),
  createdTo: z.string().optional(),
  q: z.string().optional(),
  stale: z.boolean().optional(),
});

export const TicketSortSchema = z.object({
  field: z.enum(["updatedAt", "createdAt", "priority", "status", "subject"]),
  dir: z.enum(["asc", "desc"]),
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
  scope: ViewScopeSchema,
  ownerId: z.string().optional(),
  role: UserRoleSchema.optional(),
  filters: TicketFiltersSchema,
  sort: TicketSortSchema.array(),
  groupBy: z.enum(["org", "status", "priority", "assignee"]).optional(),
  columns: z.string().array().optional(),
});

export const TicketRowSchema = z.object({
  id: z.string(),
  subject: z.string(),
  descriptionPreview: z.string(),
  status: z.string(),
  priority: z.string(),
  category: TicketCategorySchema.optional(),
  org: OrgRefSchema,
  requester: UserRefSchema,
  primaryAssignee: UserRefSchema.optional(),
  assigneeCount: z.number(),
  assigneesPreview: UserRefSchema.array(),
  createdAt: z.string(),
  updatedAt: z.string(),
  isStale: z.boolean(),
  unread: z.boolean().optional(),
});

export const TicketRowsSchema = TicketRowSchema.array();

export const ListResponseSchema = z.object({
  rows: TicketRowSchema.array(),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  serverTime: z.string(),
});

export const ActivityEntrySchema = z.object({
  id: z.string(),
  type: z.enum([
    "status_change",
    "priority_change",
    "assignee_change",
    "comment",
    "created",
    "updated",
  ]),
  actor: z.object({
    id: z.string(),
    name: z.string(),
    avatarUrl: z.string().optional(),
  }),
  changes: z
    .record(z.string(), z.object({ from: z.string(), to: z.string() }))
    .optional(),
  comment: z.string().optional(),
  createdAt: z.string(),
});

export const TicketDetailSchema = TicketRowSchema.extend({
  description: z.string(),
  activity: ActivityEntrySchema.array(),
  threadId: z.string().nullable(),
});

export const NewTicketDraftSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  category: TicketCategorySchema.optional(),
  priority: TicketPrioritySchema.optional(),
  assigneeIds: z.string().array().default([]),
});

export const AssignPayloadSchema = z.object({
  add: z.string().array().default([]),
  remove: z.string().array().default([]),
});

export const TicketParticipantSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  user: UserRefSchema,
  role: TicketParticipantRoleSchema,
  isPrimary: z.boolean(),
  addedBy: UserRefSchema.optional(),
  createdAt: z.string(),
});

export const UpdateTicketPayloadSchema = z
  .object({
    subject: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    category: TicketCategorySchema.optional(),
    status: TicketStatusSchema.optional(),
    priority: TicketPrioritySchema.optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one ticket field is required",
  });

export const BulkTicketPayloadSchema = z.object({
  ids: z.string().array().min(1),
  action: z.enum(["assign", "status", "priority", "close"]),
  assigneeIds: z.string().array().optional(),
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
});

export const BulkResultSchema = z.object({
  succeeded: z.string().array(),
  failed: z.array(z.object({ id: z.string(), reason: z.string() })),
});

export const CreateViewPayloadSchema = z.object({
  name: z.string().min(1),
  filters: TicketFiltersSchema.default({}),
  sort: TicketSortSchema.array().default([{ field: "updatedAt", dir: "desc" }]),
  groupBy: z.enum(["org", "status", "priority", "assignee"]).optional(),
  columns: z.string().array().optional(),
});

export const UpdateViewPayloadSchema = CreateViewPayloadSchema.partial().refine(
  (payload) => Object.keys(payload).length > 0,
  { message: "At least one view field is required" },
);

export const TicketSearchParamsSchema = TicketFiltersSchema.extend({
  q: z.string().min(1),
  limit: z.number().int().positive().max(100).optional(),
});

export const ViewListSchema = ViewSchema.array();

export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;
export type TicketCategory = z.infer<typeof TicketCategorySchema>;
export type TicketFilters = z.infer<typeof TicketFiltersSchema>;
export type TicketSort = z.infer<typeof TicketSortSchema>;
export type TicketListParams = z.infer<typeof TicketListParamsSchema>;
export type TicketFilterParams = z.infer<typeof TicketFilterParamsSchema>;
export type View = z.infer<typeof ViewSchema>;
export type TicketRow = z.infer<typeof TicketRowSchema>;
export type TicketRows = z.infer<typeof TicketRowsSchema>;
export type ListResponse = z.infer<typeof ListResponseSchema>;
export type ActivityEntry = z.infer<typeof ActivityEntrySchema>;
export type TicketDetail = z.infer<typeof TicketDetailSchema>;
export type NewTicketDraft = z.infer<typeof NewTicketDraftSchema>;
export type AssignPayload = z.infer<typeof AssignPayloadSchema>;
export type TicketParticipant = z.infer<typeof TicketParticipantSchema>;
export type UpdateTicketPayload = z.infer<typeof UpdateTicketPayloadSchema>;
export type BulkTicketPayload = z.infer<typeof BulkTicketPayloadSchema>;
export type BulkResult = z.infer<typeof BulkResultSchema>;
export type CreateViewPayload = z.infer<typeof CreateViewPayloadSchema>;
export type UpdateViewPayload = z.infer<typeof UpdateViewPayloadSchema>;
export type TicketSearchParams = z.infer<typeof TicketSearchParamsSchema>;
export type IdParams = z.infer<typeof IdParamsSchema>;
export type DeleteResponse = z.infer<typeof DeleteResponseSchema>;
