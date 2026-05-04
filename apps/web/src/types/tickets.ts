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
  TicketCategory,
  TicketPriority,
  TicketRow,
  TicketSort,
} from "@shared/schema/tickets";

export type SortField = TicketSort["field"];
export type Density = "compact" | "comfortable";
export type DrawerTab = "Details" | "Activity" | "Messages";

export type TicketGroup = {
  org: string;
  rows: TicketRow[];
};

export type FlatTicketRow =
  | { kind: "group"; id: string; group: TicketGroup }
  | { kind: "row"; id: string; row: TicketRow };

export type TicketDraft = {
  subject: string;
  description: string;
  category: TicketCategory | "";
  priority: TicketPriority;
};
